# Phase 2 — Harden GitHub README Rendering

**Status:** Implemented locally — production verification pending  
**Scope:** Public project case studies at `/projects/[slug]`  
**Primary owner:** Frontend  
**Security objective:** Render useful GitHub README content without allowing repository-controlled HTML or URLs to execute unsafe behavior in the portfolio origin.

## 1. Context

Project case studies fetch a public GitHub README through the NestJS API and render it in `frontend/src/features/projects/ProjectCaseStudy.tsx`.

The current renderer uses `rehypeRaw` so that README content can include useful raw HTML such as image layouts and `<details>` blocks. It also supports GitHub-flavored Markdown, syntax highlighting, Mermaid diagrams, badges, relative assets, multiple repositories, and demo links.

`rehypeRaw` must not run without a sanitizer: a public repository is external content, so its README must be treated as untrusted input even when it belongs to the portfolio owner.

## 2. Goals

- Preserve a polished, documentation-rich case study: headings, tables, task lists, code blocks, Mermaid, screenshots, GIFs, badges, relative links, and collapsible details.
- Remove executable or high-risk HTML from README content before React renders it.
- Restrict external URL protocols to safe, intended protocols.
- Keep existing project URLs and README formats working without a content migration.
- Add regression coverage for unsafe and expected README fixtures.

## 3. Non-goals

- Do not move README storage from GitHub to the database.
- Do not create a separate Project CMS or Supabase Storage flow in this phase.
- Do not permit arbitrary iframe/video embeds. Demo media remains a controlled `demoUrl` CTA configured in project data.
- Do not allow raw inline SVG. Diagrams continue to use Mermaid code blocks and the existing `MermaidRenderer`.

## 4. Threat Model

| Input | Threat | Required control |
| --- | --- | --- |
| Raw README HTML | `<script>`, event attributes such as `onerror`, unsafe forms, DOM injection | Parse raw HTML, then sanitize with an explicit allowlist. |
| README links | `javascript:`, `vbscript:`, unexpected `data:` URLs, tabnabbing | Allow only HTTP(S), `mailto:` for links, normalize `target`/`rel`. |
| README images | Script/data payloads and malformed relative URLs | Allow HTTP(S), relative GitHub assets, optionally only `data:image/*`; reject all other data protocols. |
| CSS/SVG/embed | Styling abuse, external executable content, SVG script vectors | Strip `style`, raw SVG, iframe, object, embed, form and media embed tags. |
| Syntax/Mermaid | Sanitizer accidentally removes code classes required by renderer | Allow controlled `className` values for `language-*`, `hljs-*`, Mermaid and table/task-list semantics. |

## 5. Target Rendering Pipeline

```text
GitHub README (untrusted)
  → preprocess relative image/link paths
  → remark-gfm + remark-frontmatter
  → rehype-raw
  → rehype-sanitize (custom case-study schema)
  → rehype-highlight
  → React component mapping
  → MermaidRenderer for fenced ```mermaid blocks
```

Sanitization must occur **after** `rehypeRaw`, otherwise raw HTML is not parsed and cannot be filtered. It must occur **before** `rehypeHighlight`, so the highlighter can safely add its own classes afterward.

## 6. Allowed Content Policy

### Markdown and semantic HTML to preserve

- Markdown: headings, paragraphs, emphasis, strong, strikethrough, lists, task lists, tables, blockquotes, thematic breaks, code fences, links and images.
- HTML tags: `a`, `abbr`, `b`, `blockquote`, `br`, `code`, `del`, `details`, `div`, `em`, `figcaption`, `figure`, `h1`–`h6`, `hr`, `i`, `img`, `kbd`, `li`, `mark`, `ol`, `p`, `pre`, `s`, `small`, `span`, `strong`, `sub`, `summary`, `sup`, `table`, `tbody`, `td`, `th`, `thead`, `tr`, `ul`.
- Attributes only where relevant: `href`, `src`, `alt`, `title`, `width`, `height`, `colspan`, `rowspan`, `align`, `open`, `id`, `className`, `target`, `rel`.

### Explicitly removed

- Tags: `script`, `style`, `svg`, `iframe`, `object`, `embed`, `form`, `input`, `button`, `video`, `audio`, `canvas`, `base`, `meta`, `link`.
- Every event handler attribute, including `onclick`, `onerror`, `onload`, and future `on*` properties.
- Inline `style`, `srcdoc`, remote stylesheet references and arbitrary data payloads.

### URL rules

| Context | Allowed |
| --- | --- |
| Links | `https:`, `http:`, `mailto:`, fragment links, resolved relative GitHub URLs |
| Images | `https:`, `http:`, resolved relative GitHub URLs; `data:image/*` only if retained after implementation review |
| Demo CTA | `https:` or `http:` only |

All other protocols resolve to an empty URL and must not generate a clickable or loadable element.

## 7. Implementation Plan

1. Add `rehype-sanitize` to the frontend workspace.
2. Create `frontend/src/features/projects/case-study-sanitize.ts`:
   - Export the custom `rehype-sanitize` schema.
   - Export small, pure URL helpers for links and images.
   - Keep protocol allowlists in one place instead of duplicating regexes in UI components.
3. Update `ProjectCaseStudy.tsx`:
   - Use the plugin pipeline in the target order.
   - Replace permissive `absoluteUrl` and `externalUrl` with typed safe helpers.
   - Do not pass uncontrolled HTML attributes through component spreads unless they have already passed the schema.
   - Preserve existing Mermaid detection and code highlighting.
4. Verify relative URL preprocessing still works for both Markdown syntax and safe raw `<img>` / `<a>` tags.
5. Add test fixtures for safe and malicious README input.
6. Update `spec.md`: mark markdown hardening complete only after tests and production verification pass.

## 8. Regression Test Matrix

| Fixture | Expected result |
| --- | --- |
| `# Heading`, GFM table, task list | Renders unchanged. |
| Fenced TypeScript code | Highlight classes/render remain available. |
| Fenced Mermaid code | Reaches `MermaidRenderer` and renders. |
| Relative `![diagram](docs/architecture.png)` | Resolves to the current repository raw-content base URL. |
| `<details><summary>More</summary>…</details>` | Remains interactive. |
| `<script>alert(1)</script>` | Tag and contents do not create executable output. |
| `<img src=x onerror=alert(1)>` | `onerror` is removed. |
| `[click](javascript:alert(1))` | Link is removed or non-clickable. |
| `<iframe src="https://evil.example">` | Entire element is removed. |
| `data:text/html,...` image/link | Rejected. |
| Badge from Shields.io | Remains visible and compact. |

Tests should exercise the sanitization utility as pure input/output behavior. A component-level smoke test should confirm Mermaid and README code blocks remain compatible with `ProjectCaseStudy`.

## 9. Verification Checklist

- [x] `pnpm --filter frontend build` passes.
- [x] Focused frontend ESLint passes with no new errors.
- [x] Existing backend tests pass (3 suites / 7 tests).
- [x] Sanitization tests cover unsafe markup, safe primitives and URL resolution (3 tests).
- [ ] Safe README content renders on at least one multi-repository project.
- [ ] Production case-study route is checked with browser devtools: no inline script/event handler from README reaches the DOM.
- [ ] Mobile layout, Mermaid diagrams, badges, screenshots, code blocks and `<details>` remain usable.

## 10. Rollback Plan

If a valid README element is unintentionally removed:

1. Do not disable sanitization globally.
2. Add the smallest necessary tag/attribute/protocol rule to the custom schema.
3. Add a regression fixture for that allowed element.
4. Re-run the full verification checklist before deploy.

## 11. Definition of Done

The phase is complete when all verification items pass, unsafe fixture content is removed, and existing public project README case studies retain their intended visual documentation features.
