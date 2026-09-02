# Phase 3 — Minimal Contact Hub & Admin Inbox

**Status:** Implemented locally and database migration applied — production storage/email verification pending
**Scope:** Public contact section, NestJS contact API, private JD attachment storage, owner email notification, and `/admin/inbox`
**Primary owners:** Frontend + Backend
**Product objective:** Let any visitor contact the portfolio owner through one short, professional form; make hiring JDs convenient without turning the site into a CRM.

## 1. Product Decision

The existing contact section becomes a **general-purpose contact form**, not an HR-only “JD drop” form.

The form always asks for only three decisions/inputs:

1. **Topic** — `Hiring`, `Collaboration`, or `General`.
2. **Email** — required, so the owner has one clear reply channel.
3. **Message** — required, so every submission has context.

Only when the visitor chooses **Hiring** does the form reveal an optional Job Description area. The visitor can provide either a secure HTTPS JD link or one PDF attachment. Neither is required: a recruiter can still simply write a message.

This is intentionally not a chat, ticketing product, applicant-tracking system, or full CRM. The professional loop is:

```text
Visitor submits one short message
  → record is retained in the private owner inbox
  → owner receives an email alert
  → owner replies directly by normal email
```

## 2. Goals

- Make the public form useful to recruiters, collaborators, clients, peers, and general visitors.
- Keep the normal path compact: choose topic, enter email, write message, send.
- Let a recruiter attach a PDF JD or share an HTTPS JD link without exposing it publicly.
- Persist every accepted message in a protected owner-only inbox.
- Notify the owner by email, with the visitor’s address as `Reply-To`.
- Give the owner simple triage: New, Reviewed, Follow-up, Archived; search; secure attachment download; internal note.
- Treat all user content, uploads, and links as untrusted.
- Preserve the existing dark portfolio visual system while reducing the present “HR-only” wording.

## 3. Non-goals

- Visitor accounts, a public message history, in-app conversations, or replies sent from the CMS.
- A general file drive: one PDF is supported only for a Hiring submission.
- AI extraction, ranking, or automatic tailoring of JDs.
- Telegram notifications, a second notification provider, analytics dashboards, or CRM pipelines.
- A public attachment URL, an unauthenticated admin inbox, or a “success” state when persistence fails.
- A retention promise in public copy until automated retention is implemented in a later phase.

## 4. Public Experience Specification

### 4.1 Copy and fields

Replace HR-specific presentation with the following content model.

| Element | Specification |
| --- | --- |
| Eyebrow | `LET'S CONNECT` |
| Heading | `Have a product problem worth solving?` (the existing headline may remain) |
| Form heading | `Let's connect` |
| Support copy | `Tell me how I can help. I'll reply by email.` |
| Topic label | `What would you like to discuss?` |
| Topic options | `Hiring`, `Collaboration`, `General` |
| Email label | `Email` |
| Message label | `Message` |
| Hiring-only label | `Job description (optional)` |
| Link helper | `Paste an HTTPS JD link` |
| Upload helper | `Attach one PDF · max 10 MB` |
| Privacy microcopy | `Your message is used only to reply to you. Hiring attachments are private and visible only to the portfolio owner.` |

Use the selected topic to make the submit label specific:

| Topic | Submit label |
| --- | --- |
| Hiring | `Send hiring inquiry` |
| Collaboration | `Send collaboration inquiry` |
| General | `Send message` |

### 4.2 Interaction details

- Show topic choices as a compact single-select segmented control/pills; `General` is the default.
- `Email` uses an email input and is required.
- `Message` is a required textarea. It must be large enough to write a useful note without presenting a long questionnaire.
- Do not request name, company, phone, role title, preferred contact method, budget, timeline, or LinkedIn. Visitors can include any of these naturally in the message.
- When `Hiring` is selected, reveal a small optional area with two mutually exclusive modes: `Paste link` and `Attach PDF`.
- Changing away from `Hiring` clears the temporary JD link/file state and hides the area. The submitted payload must not retain an attachment or link for another topic.
- Allow exactly one mode at a time: typing a link clears the selected file; selecting a file clears the link.
- File selection displays the filename and size plus a visible remove action.
- A submission without a JD remains valid for Hiring.
- While submitting, disable the CTA and retain all entered content. Show an inline error only beside the field or operation that failed.
- On success, replace the form body with `Message received — I'll reply by email.` and an optional `Send another message` action. Do not expose internal status, storage URLs, or notification failures.

### 4.3 Accessibility and responsive behavior

- Implement topic controls as an accessible radio group or buttons with equivalent `aria-pressed` behavior; selected state must not rely on color alone.
- Every input has a persistent visible label, native semantic type, associated error text, and `aria-describedby` when invalid.
- Keep keyboard focus visible and target sizes at least 44 × 44 CSS pixels.
- Announce submit success/error in an `aria-live` region; move focus to the success heading after a successful request.
- On mobile, stack inputs and topic controls without horizontal clipping; upload/link mode remains readable and reachable without drag-and-drop.

## 5. Architecture

```text
Public Next.js ContactForm
  └─ multipart POST /api/contact
       ├─ validation, honeypot and rate limiting
       ├─ Prisma: ContactMessage record
       ├─ Supabase Storage: private contact-attachments bucket (Hiring PDF only)
       └─ Resend: owner notification, Reply-To = visitor email

Owner-only Next.js /admin/inbox
  └─ authenticated NestJS admin contact endpoints
       ├─ list / detail / status / internal note
       └─ short-lived signed attachment URL
```

The authoritative submission is the database record. An email notification is a delivery aid, not the source of truth: it is attempted only after the contact has been stored, and its outcome is recorded privately for the owner.

## 6. Data Model and Migration

### 6.1 Final data model

Use Prisma enums rather than arbitrary strings for externally meaningful fields.

```prisma
enum ContactTopic {
  HIRING
  COLLABORATION
  GENERAL
}

enum ContactStatus {
  NEW
  REVIEWED
  FOLLOW_UP
  ARCHIVED
}

enum ContactNotificationStatus {
  PENDING
  SENT
  FAILED
}

model ContactMessage {
  id                 String                    @id @default(cuid())
  topic              ContactTopic               @default(GENERAL)
  email              String
  message            String
  jdLink             String?
  fileName           String?
  attachmentPath     String?                   @unique
  attachmentMimeType String?
  fileSize           Int?
  status             ContactStatus              @default(NEW)
  internalNote       String?
  notificationStatus ContactNotificationStatus  @default(PENDING)
  notificationError  String?
  ip                 String?
  createdAt          DateTime                  @default(now())
  updatedAt          DateTime                  @updatedAt
  reviewedAt         DateTime?
  archivedAt         DateTime?
}
```

`fileUrl` is removed from the schema. Private Storage objects are represented only by an internal `attachmentPath`, never a permanent public URL.

### 6.2 Safe migration plan

The current table has `status` as a string, optional `message`, and a public `fileUrl`. Do not use a destructive rename or silently discard historical data.

1. Add the new enum types and nullable fields (`topic`, `attachmentPath`, `attachmentMimeType`, notification fields, timestamps) through an additive migration.
2. Backfill old records:
   - missing topic → `GENERAL`;
   - `UNREAD` status → `NEW`;
   - other valid existing statuses map explicitly to their closest new value;
   - missing message → an internal migration-safe placeholder only if required by the new constraint. Prefer keeping the column nullable during the first migration, then resolve/verify historical rows before making it required.
3. Preserve old contact messages, but remove the obsolete `fileUrl` value; an old public upload URL cannot be safely converted into a private object path.
4. Generate Prisma client, run the migration locally, and inspect existing rows before production deployment.
5. [x] Remove the legacy column in the approved cleanup migration `20260902110000_remove_legacy_contact_file_url`.

## 7. Backend Implementation Plan

### 7.1 Public submission contract

Replace the existing HR-shaped DTO with this contract:

```text
POST /api/contact   Content-Type: multipart/form-data

topic       required: HIRING | COLLABORATION | GENERAL
email       required: valid email, normalized and max 320 characters
message     required: trimmed, 1–3000 characters
jdLink      optional: HTTPS URL, max 1000 characters; HIRING only
file        optional: one PDF, max 10 MiB; HIRING only
website     optional honeypot; must be empty
```

Server-side rules are authoritative; the frontend’s conditional fields are only a usability enhancement.

- Reject a JD link or attachment for `COLLABORATION` and `GENERAL`.
- Reject a request that contains both a JD link and a file.
- Reject blank/whitespace-only messages after trimming.
- Return a clear 4xx validation response for invalid data and a 5xx/503 response for an unavailable dependency. Never report success before the database write is complete.
- Keep the current low-volume anti-spam baseline (honeypot and rate limiting). Centralize its configuration and preserve reverse-proxy-aware client IP handling for Render.

### 7.2 Private PDF upload flow

Create a new **private** Supabase Storage bucket named `contact-attachments`. Do not reuse the current public project asset bucket.

1. Accept only a single file under the `file` field.
2. Check file size before storage (`<= 10 MiB`).
3. Accept only `application/pdf`; verify the PDF file signature (`%PDF-`) from the file bytes rather than trusting the browser-provided MIME type or filename.
4. Generate the contact ID and a random object key such as `contacts/{contactId}/{uuid}.pdf`; do not use visitor-provided file names as a path.
5. Store the object using the server-only Supabase service-role client. The browser receives neither the service-role key nor a public object URL.
6. Store only the generated object path plus safe display metadata in the database.
7. If upload fails, compensate for any provisional database record and return an error. Do not save a message while falsely claiming its attachment was included.
8. If database persistence fails after an object is uploaded, delete that new object as compensation and return an error.
9. Log operation IDs and failure classes, never the PDF content, access URL, or full message body.

### 7.3 Owner notification through Resend

Use Resend for one owner notification after a record and optional upload are successfully persisted.

- `from`: a verified domain sender, e.g. `Portfolio <contact@your-domain>`.
- `to`: `CONTACT_OWNER_EMAIL`.
- `replyTo`: the visitor’s validated email.
- Subject: `[Portfolio] ${topic}: new message from ${email}`.
- Body includes topic, email, message, optional JD link, filename/size, the contact ID, and a direct CMS inbox URL. It never includes a permanent attachment URL.
- Record `SENT` only after Resend confirms a successful response; record `FAILED` and a redacted error otherwise.
- A Resend failure must not undo an already stored contact; it appears in the inbox as a notification warning so the owner can still respond.
- Do not send an automatic confirmation email to the visitor in this phase; it adds deliverability, privacy, and spam concerns without improving the core workflow.

### 7.4 Owner-only inbox API

Protect every endpoint below with the same Supabase authentication and portfolio-owner authorization policy used by private CMS data. A logged-in non-owner must receive `403`, not another user’s data.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/admin/contacts?status=&topic=&q=&cursor=` | Cursor-paginated contact list; returns no attachment URL. |
| `GET /api/admin/contacts/:id` | Full contact record and private operational metadata. |
| `PATCH /api/admin/contacts/:id` | Update `status` and optional `internalNote`; timestamp reviewed/archive transitions. |
| `POST /api/admin/contacts/:id/attachment-url` | Returns a signed download URL valid for five minutes only when the record has a private attachment. |

Rules:

- Search only across email and message (case-insensitive); cap query length and escape/filter through Prisma, never raw SQL.
- Sort newest first and paginate rather than returning the full inbox.
- Do not return `ip`, notification error internals, or storage paths in list responses unless the owner detail view needs a narrowly defined field.
- Return `404` for unknown IDs without revealing whether another account owns a record.
- Archive rather than delete in this phase; destructive deletion and retention automation require a separately reviewed policy.

## 8. Frontend Implementation Plan

### 8.1 Public form

Refactor `frontend/src/features/home/ContactForm.tsx` around a small typed form state:

```ts
type ContactTopic = "HIRING" | "COLLABORATION" | "GENERAL";
type HiringJdMode = "LINK" | "FILE";
```

- Keep `FormData` for the multipart request.
- Use client-side checks only to provide fast feedback; do not duplicate the backend as a security boundary.
- On a topic change, remove incompatible JD state before a submit is possible.
- Show a PDF-only chooser, filename, size, remove control, upload progress/loading state, and server-returned error.
- Keep direct email, GitHub, LinkedIn, and CV buttons as secondary contact routes.
- Preserve the established dark/purple presentation, but replace `Direct Message & JD Drop`, `Work Email`, and HR-specific hints with the copy in section 4.

### 8.2 Admin inbox UI

Add a protected `/admin/inbox` route and a visible `Inbox` entry in the CMS navigation.

Desktop layout:

```text
Inbox toolbar: search | Topic filter | Status filter | New count
────────────────────────────────────────────────────────────────
Contact list (left)        Selected contact detail (right)
email · topic · time       message, link, secure PDF action
status pill                status selector, internal note, alert
```

Mobile layout stacks the selected detail below the list; it must not rely on hover interactions.

Detail actions:

- Copy visitor email.
- Open a normal `mailto:` reply using that address.
- Open a validated JD link in a new tab with `noopener noreferrer`.
- Request a five-minute signed URL only when the owner clicks `Download PDF`.
- Update status and save a short internal note explicitly.

Inbox UX requirements:

- Default filter is `NEW`; show count without hiding other statuses.
- Use clear status colors and text, never color alone.
- Display time in the owner’s locale and retain a precise timestamp in accessible text.
- Clearly show `Notification failed` only to the owner, alongside the stored contact—not as a visitor-facing error.
- Do not render untrusted message content as HTML; React text rendering only.

## 9. Configuration and External Setup

### 9.1 Environment variables

Document these variables in backend `.env.example` without values:

```dotenv
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CONTACT_ATTACHMENT_BUCKET=contact-attachments
RESEND_API_KEY=
CONTACT_FROM_EMAIL=Portfolio <contact@example.com>
CONTACT_OWNER_EMAIL=
```

The backend must fail fast at startup in production when a required private-storage or sender configuration is absent. No service-role variable is ever prefixed with `NEXT_PUBLIC_` or added to Vercel.

### 9.2 Manual production checklist

1. [x] Create `contact-attachments` in Supabase Storage as a **private** bucket (created and verified at 10 MiB/PDF-only on 2026-09-02).
2. [~] Confirm browser/anonymous roles cannot list or download bucket objects; backend access is service-role only. The bucket is private and server code only uses the service role; browser-level production verification remains pending.
3. Add the backend environment variables in Render and redeploy the backend.
4. Verify the sending domain in Resend, including the DNS records Resend supplies (SPF/DKIM), then use that verified address as `CONTACT_FROM_EMAIL`.
5. Add the deployed frontend origin to NestJS CORS configuration.
6. Configure `NEXT_PUBLIC_API_BASE_URL` in Vercel to the deployed Render API URL, redeploy the frontend, and test from the production domain.

## 10. Security, Privacy, and Reliability Controls

| Risk | Required phase-3 control |
| --- | --- |
| Spam/bots | Honeypot, rate limit, email/message validation, predictable error shape. |
| Malicious file | One PDF only, 10 MiB limit, MIME plus `%PDF-` signature check, random key, private bucket. |
| Accidental public JD | No `getPublicUrl`; only owner-authenticated, five-minute signed downloads. |
| XSS through message/link | Render message as text; validate/sanitize URL protocol; no dangerous HTML rendering. |
| Inbox data exposure | Owner guard on every admin contact endpoint; no auth token or service role in frontend. |
| Notification failure | Persist contact first, record delivery outcome, show owner-only warning. |
| Partial storage failure | Compensating DB/object cleanup; do not claim an attachment was received if it was not stored. |
| Sensitive logging | Avoid message/PDF contents, signed URLs, tokens, and raw authorization headers in logs. |

The approach follows the same core controls recommended by the [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [Supabase private bucket guidance](https://supabase.com/docs/guides/storage/buckets/fundamentals), and [Resend domain verification guidance](https://resend.com/docs/dashboard/domains/introduction).

## 11. Implementation Sequence

### Step 0 — Baseline and design lock

- Capture current public contact behavior and existing API contract.
- Confirm the three topics and exact public copy in section 4; no additional required fields are added during implementation.
- Identify and preserve unrelated working-tree changes before editing.

### Step 1 — Schema and configuration

- Update Prisma schema with enums and additive fields.
- Generate a reviewed migration with legacy data backfill.
- Update DTOs/types and `.env.example`.
- Create/configure the private bucket and verified Resend sender in non-production or production configuration as appropriate.

### Step 2 — Harden the public contact service

- Implement strict DTO validation, one-PDF interceptor/filter, file-signature validation, and topic-specific rules.
- Create an isolated storage service with no public URL method.
- Implement the compensation path for DB/storage failures.
- Add Resend notification service with persisted delivery status.
- Retain and test anti-spam behavior.

### Step 3 — Build protected inbox endpoints

- Apply owner guard/policy.
- Add cursor pagination, constrained filters/search, detail lookup, update DTO, and signed-download endpoint.
- Ensure serialized responses never leak service-role data, permanent attachment URLs, or fields not needed by each view.

### Step 4 — Refine the public UI

- Implement the compact topic control, conditional hiring-only JD controls, validation, loading, success, and error states.
- Update visual copy and responsive/accessibility behavior.
- Manually verify keyboard, screen-reader semantics, mobile layout, mode switching, and retry after errors.

### Step 5 — Implement the CMS inbox

- Add protected route, navigation entry, list/detail layout, filters, status update, internal note, reply action, and on-demand PDF download.
- Verify an authenticated non-owner cannot access data or signed downloads.

### Step 6 — Test, deploy, and document

- Run all automated checks and production smoke tests in section 12.
- Update `spec.md` only with work demonstrably completed.
- Update this phase document with actual verification results and any intentionally deferred item.

## 12. Test and Verification Matrix

### Backend automated tests

| Case | Expected result |
| --- | --- |
| General valid message | Creates `GENERAL` contact, no attachment, notification attempted. |
| Collaboration valid message | Creates `COLLABORATION` contact. |
| Hiring message with HTTPS JD link | Creates `HIRING` contact with safe link. |
| Hiring message with valid small PDF | Stores a private object path; no public URL is returned. |
| PDF MIME/name spoofing or invalid bytes | Rejected before storage. |
| File over 10 MiB | Rejected. |
| JD link/file outside Hiring | Rejected. |
| Both link and file | Rejected. |
| Blank message, invalid email, non-HTTPS URL | Rejected with 4xx. |
| Storage failure | Request fails; compensation leaves no orphan record/object. |
| Resend failure | Contact remains stored, notification is `FAILED`; visitor response does not claim email delivery. |
| Non-owner inbox request | `403`; no record or signed URL exposed. |
| Owner signed attachment request | Valid short-lived URL only for that record’s private path. |

### Frontend automated/manual tests

- General default: exactly topic, email, and message are visible; no JD field.
- Topic switch: Hiring fields appear; switching away clears JD state.
- Link/file exclusivity and remove action work without page reload.
- Required/error/loading/success states are readable with keyboard only.
- Long message, small screens, and network error do not break layout or discard entered values.
- Inbox filtering, search, status transitions, internal-note save, `mailto:` reply, and on-demand download work.

### Required commands before merge

```powershell
pnpm --filter backend prisma:generate
pnpm --filter backend test
pnpm --filter backend build
pnpm --filter frontend test
pnpm --filter frontend lint
pnpm --filter frontend build
```

Use the repository’s actual scripts if their names differ; do not treat a successful build alone as behavioral verification.

### Production smoke test

1. Submit one General message from the deployed public portfolio.
2. Confirm the owner notification arrives from the verified domain and reply goes to the visitor.
3. Confirm the contact is visible only in the owner’s `/admin/inbox`.
4. Submit a Hiring message with a harmless test PDF; verify the bucket object is private and the owner can download only through the signed action.
5. Confirm the public network response and CMS do not expose a permanent Supabase object URL.
6. Test a non-owner account and unauthenticated request against each admin route.

## 13. Definition of Done

Phase 3 is complete only when:

- [x] The public form is general-purpose, minimal, and matches section 4.
- [x] Hiring-only JD link/PDF behavior is enforced by both UI and API.
- [x] Every successful submission is persisted and visible in an owner-only inbox.
- [~] Attachments use private object paths and five-minute signed URLs in code; the private 10 MiB/PDF-only bucket was created and verified, while browser-level production verification remains pending.
- [~] Notification delivery status is visible in the inbox; verified-domain Resend delivery still needs production configuration/verification.
- [~] Unit coverage verifies key validation rules; owner authorization, storage failure, and signed-download routes still need integration/production verification.
- [~] Backend/frontend tests and builds pass locally; production smoke tests are pending.
- [x] `spec.md` and this document reflect the verified local state.

## 14. Follow-up Candidates (Not Part of This Phase)

- Scheduled 90-day retention/deletion for contacts and private objects, after a user-visible privacy policy is agreed.
- Persistent distributed rate limiting (for multi-instance scaling).
- Spam challenge escalation only if real abuse appears.
- Opt-in visitor acknowledgement email.
- AI-assisted JD extraction or CV matching, Telegram alerts, and CRM integrations.
