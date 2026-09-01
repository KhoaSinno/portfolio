# Phase 1 — Public Resume Cache, Revalidation, and Safe Fallback

## 1. Context

The public home page reads the primary published resume through `GET /api/resume`.
Today, an unavailable or slow backend causes the page to render `defaultResume`.
That fallback is static example data with two projects, so it can be cached by ISR and shown
instead of the real `portfolio-resume` data, which currently has three projects.

This phase makes the public portfolio resilient without presenting invented or stale example
content as real portfolio data.

## 2. Goals

1. Cache a successfully fetched public resume and serve the latest cached success if the backend
   is temporarily unavailable.
2. Invalidate that cache immediately after `portfolio-resume` is published, so the next public
   request obtains the newly published content instead of waiting for the normal cache TTL.
3. Remove `defaultResume` as a production fallback for the public home page.
4. Show an honest temporary-unavailable state if neither the backend nor a successful snapshot is
   available.

## 3. Non-goals

- Changing the resume editor’s draft/default content.
- Eliminating all caching from the public portfolio.
- Solving backend cold starts or changing hosting providers.
- Supporting every resume profile in this phase; Phase 1 targets the public primary resume
  (`Resume.id = portfolio-resume`).

## 4. Design decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Cache key | `resume:portfolio-resume` | One stable key for the public primary profile. |
| Cache invalidation | Hard-expire the tag and revalidate affected paths after a successful publish | The next request recomputes rather than using stale-while-revalidate data. |
| Fallback source | Last successful cached/snapshotted API response | It is real historical portfolio data, never local sample data. |
| Cache miss + backend down | Render a temporary-unavailable page/state | No code path can know the true resume data in this condition. |
| `defaultResume` | Keep for editor/demo only; do not use in the public route | Prevents two fake projects from appearing as production content. |
| Normal TTL | Keep a bounded safety TTL (initial recommendation: 5 minutes) | Revalidation is the normal update path; TTL recovers if the callback is missed. |

## 5. Target request flow

```text
Publish portfolio-resume
  |
  +--> Backend writes published Resume + version successfully
  |
  +--> Backend POSTs to Frontend /api/internal/revalidate-resume
         (authenticated with a shared secret)
  |
  +--> Frontend validates the committed payload, upserts the durable snapshot,
       hard-expires tag resume:portfolio-resume, and revalidates public paths
  |
  +--> Next portfolio request fetches the latest GET /api/resume response
         and stores it in the normal Next cache

Normal request while backend is unavailable
  |
  +--> Return last successful snapshot, if one exists
  |
  +--> Otherwise render PublicResumeUnavailable (no sample resume)
```

## 6. Implementation plan

### 6.1 Define public-resume cache/snapshot contract

Create a server-only module, for example:

`frontend/src/features/resume/public-resume-cache.ts`

Responsibilities:

- Define `PUBLIC_RESUME_CACHE_TAG = "resume:portfolio-resume"`.
- Fetch and validate `GET ${API_BASE_URL}/resume` with the existing Zod parser.
- Treat a response as cacheable only when it is HTTP 200 and `parseResumeContent` succeeds.
- Read the last successful validated result from the chosen durable snapshot store.
- Reserve snapshot writes for the post-commit publish callback and the bootstrap command. This prevents an in-flight older cache read from overwriting a newly published snapshot.
- Never overwrite a valid snapshot with a timeout, non-2xx response, malformed response, or
  `null` parse result.

Recommended return type:

```ts
type PublicResumeLoadResult =
  | { state: "fresh"; resume: ResumeData }
  | { state: "snapshot"; resume: ResumeData; savedAt: string }
  | { state: "unavailable" };
```

The caller must distinguish `snapshot` from `unavailable`; it must not silently replace either
state with `defaultResume`.

### 6.2 Choose and implement the durable snapshot store

The Next Data Cache is suitable for normal caching, but a persistent snapshot must survive a
failed revalidation and should be readable across server instances.

Preferred Phase 1 option: add a small `PublicResumeSnapshot` record to PostgreSQL/Supabase.

Suggested fields:

```text
key          string, primary key              // "portfolio-resume"
resumeId     string                           // "portfolio-resume"
content      JSONB                            // validated ResumeData
sourceUpdatedAt timestamp/null                // value from the source resume if available
savedAt      timestamp                        // snapshot write time
```

Alternative only if frontend cannot access the database: write the snapshot from the backend into
a protected endpoint/object store and expose it to the frontend through a server-only API. Do not
store this snapshot in browser `localStorage`, because a first visitor and server rendering cannot
rely on it.

The snapshot write operation is allowed only after a validated successful backend response. It is
an upsert by `key`, ensuring one latest-known-good snapshot for the public primary resume.

### 6.3 Update the frontend read path

Replace the current pattern in `frontend/src/app/page.tsx`:

```ts
let resume = defaultResume;
try {
  const published = await getPublishedResume();
  if (published) resume = published;
} catch {
  resume = defaultResume;
}
```

with a call to the new loader:

```ts
const result = await getPublicResumeForPortfolio();
```

Rendering rules:

- `fresh`: render the resume normally.
- `snapshot`: render the resume normally. Optionally log this server-side for observability; do
  not expose an alarming message to visitors.
- `unavailable`: render a lightweight `PublicResumeUnavailable` page/state with a retry link and
  a `noindex` metadata directive. Do not render any resume sections, JSON-LD person data, sitemap
  project URLs, or `defaultResume` content.

`frontend/src/app/sitemap.ts` must use the same loader semantics. When unavailable, it should
return the non-resume base routes only, never generate URLs from `defaultResume`.

### 6.4 Tag normal successful data requests

Extend `getPublishedResume` (or move its work into the new cache module) so the successful fetch
is tagged and has a safety revalidation interval:

```ts
fetch(`${API_BASE_URL}/resume`, {
  signal: AbortSignal.timeout(PUBLIC_RESUME_REQUEST_TIMEOUT_MS),
  next: {
    revalidate: 300,
    tags: ["resume:portfolio-resume"],
  },
});
```

Do not cache malformed payloads: parse them before committing a snapshot. The exact framework
cache behavior on a failed upstream request must not be the only fallback guarantee; the durable
snapshot handles that case explicitly.

### 6.5 Add authenticated frontend revalidation endpoint

Create a Next route handler, for example:

`frontend/src/app/api/internal/revalidate-resume/route.ts`

Contract:

```text
POST /api/internal/revalidate-resume
Authorization: Bearer <RESUME_REVALIDATE_SECRET>
Content-Type: application/json

{ "resumeId": "portfolio-resume" }
```

Behavior:

1. Reject missing/invalid authorization with `401`.
2. Reject an unexpected resume ID with `400` in Phase 1.
3. In the pinned Next.js 16 version, call
   `revalidateTag("resume:portfolio-resume", { expire: 0 })`. This hard-expires the tag, so the
   next cache read recomputes instead of using stale-while-revalidate behavior.
4. Call `revalidatePath("/")` and `revalidatePath("/resume")` so independently cached public
   routes are invalidated too.
5. Return `{ "revalidated": true }` only after invalidation succeeds.
6. Log request outcome without logging the secret or resume content.

`revalidateTag("resume:portfolio-resume", { expire: 0 })` is intentional. Do **not** use the
`"max"` profile for this endpoint: in Next.js 16 it is stale-while-revalidate and could serve the
old resume once more after a publish.

Required environment variables:

```text
# frontend deployment
RESUME_REVALIDATE_SECRET=<long random value>

# backend deployment
FRONTEND_REVALIDATE_URL=https://<frontend-domain>/api/internal/revalidate-resume
RESUME_REVALIDATE_SECRET=<same long random value>
```

Secrets must be server-only; do not prefix them with `NEXT_PUBLIC_` and do not commit them to
`.env.example` with a real value.

### 6.6 Trigger revalidation after publish

In `backend/src/resume/resume.service.ts`, trigger the callback only after the publish transaction
has committed successfully for `portfolio-resume`.

Rules:

- Publishing must remain successful if the revalidation callback fails. The database is the source
  of truth.
- Record a warning/structured log for callback failure, including resume ID and HTTP status, but
  never credentials or resume JSON.
- Use a short bounded timeout and one small retry for transient network errors.
- Do not call the endpoint when saving a draft; only call after a public publish or after an
  operation that changes the published payload.
- If the callback fails permanently, the normal TTL is the fallback refresh path.

Recommended sequence:

```text
database publish committed
  -> POST revalidation endpoint
  -> endpoint invalidates tag/path
  -> return publish response
```

The follow-up request, rather than the revalidation request itself, should populate the new
frontend cache and write the successful snapshot.

### 6.7 Initial snapshot bootstrap

Before deploying this phase, create the first snapshot from the currently published
`portfolio-resume` record (after Zod validation). This prevents a deployment-time cache miss from
showing the unavailable state while the backend is sleeping.

Provide an authenticated, idempotent admin command or script that:

1. Reads published `portfolio-resume`.
2. Validates it using the same public schema.
3. Upserts the snapshot.
4. Prints only resume ID, project count, and snapshot timestamp.

Run it once before enabling the new public read path, and retain it as a recovery operation.

## 7. Failure behavior matrix

| Situation | Public result | Snapshot action | Cache/revalidation action |
| --- | --- | --- | --- |
| BE returns valid latest resume | Render fresh data | Upsert snapshot | Store/tag normal cache |
| BE times out; snapshot exists | Render snapshot | Keep unchanged | Preserve previous success; log failure |
| BE returns malformed JSON; snapshot exists | Render snapshot | Keep unchanged | Do not cache malformed response |
| BE returns 404; snapshot exists | Render snapshot and alert operators | Keep unchanged | Do not replace snapshot automatically |
| BE unavailable; no snapshot | Render temporary unavailable state | None | No sample-data cache |
| Publish succeeds; revalidate callback succeeds | Existing page remains valid until next request | Next valid request refreshes snapshot | Tag/path invalidated immediately |
| Publish succeeds; callback fails | Existing cache/snapshot remains usable | Unchanged until next valid fetch | TTL eventually refreshes; log warning |

## 8. Observability

Add server-side structured events/counters:

- `public_resume.fresh_fetch`
- `public_resume.snapshot_served`
- `public_resume.unavailable`
- `public_resume.invalid_payload`
- `public_resume.revalidate_requested`
- `public_resume.revalidate_failed`

Include: resume ID/key, source (`fresh` or `snapshot`), duration, HTTP status, and snapshot age.
Exclude: resume content, access tokens, database URLs, and revalidation secrets.

## 9. Test plan

### Unit tests

- Valid HTTP payload returns `fresh` and writes a snapshot.
- Timeout with an existing snapshot returns `snapshot`.
- Timeout without a snapshot returns `unavailable`.
- Invalid Zod payload never replaces an existing snapshot.
- `defaultResume` is not imported or selected by the public home data path.
- Revalidation endpoint rejects invalid/missing secret and wrong resume ID.
- Revalidation endpoint invalidates the expected tag.

### Integration tests

- Publish `portfolio-resume`; verify the backend calls the configured frontend endpoint with the
  expected authenticated request.
- Simulate callback failure; verify publish remains successful and a warning is logged.
- Load `/` after a successful API response, then make the API unavailable; verify the saved
  snapshot’s three projects render.
- Load `/` with neither API nor snapshot; verify the temporary-unavailable state renders and no
  sample project title appears.

### Manual deployment verification

1. Bootstrap a snapshot from the existing DB record; confirm it has three projects.
2. Deploy frontend and backend environment variables/secret.
3. Publish a harmless change to `portfolio-resume`.
4. Confirm the next public request shows the change without waiting for 300 seconds.
5. Temporarily block frontend-to-backend traffic.
6. Confirm the last good resume stays visible; confirm no default two-project page appears.
7. Test a clean environment with no snapshot and backend unavailable; confirm the unavailable
   state appears.

## 10. Acceptance criteria

- The public homepage never renders `defaultResume` in production.
- The published `portfolio-resume` content is the source for every normal public render.
- A successful publish invalidates the relevant frontend cache without waiting for the TTL.
- A backend outage after at least one successful load still serves the last validated snapshot.
- A first-ever cache/snapshot miss during backend outage presents an explicit temporary state,
  never fabricated portfolio content.
- Snapshot fallback and revalidation behavior are covered by automated tests.

## 11. Rollout and rollback

### Rollout

1. Add schema/store and bootstrap the initial snapshot.
2. Deploy frontend loader and unavailable UI behind a feature flag if available.
3. Configure matching revalidation secret and endpoint URL in both deployments.
4. Deploy backend publish callback.
5. Publish one controlled resume update and complete the manual verification checklist.
6. Remove the public-page `defaultResume` fallback after verification.

### Rollback

- If the revalidation callback is faulty, disable the backend callback; normal TTL and snapshot
  behavior continue.
- If snapshot reads fail, render the explicit unavailable state rather than reintroducing sample
  content.
- Do not delete existing snapshots during rollback; they are recovery data.

## 12. Follow-up phases

- Generalize cache keys and revalidation to additional published resume profiles/slugs.
- Add an operator dashboard for snapshot age and revalidation failures.
- Add publish-event queueing/outbox for guaranteed eventual revalidation.
- Revisit timeout and TTL after the backend hosting upgrade.
