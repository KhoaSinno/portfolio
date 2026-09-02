# PROJECT SPECIFICATION: IT FULLSTACK INTERN PORTFOLIO

FE: https://portfolio-frontend-rust-theta.vercel.app

BE: https://portfolio-api-fna4.onrender.com/api/health

## Trạng thái triển khai thực tế — 02/09/2026

**Ký hiệu:** `[x]` hoàn thành trong source code · `[~]` đã có nền tảng nhưng còn thiếu/đang chờ xác minh production · `[ ]` chưa triển khai.

### Đã hoàn thành

- [x] Monorepo pnpm gồm `frontend` (Next.js + TypeScript) và `backend` (NestJS + Prisma).
- [x] Supabase PostgreSQL được dùng cho dữ liệu CV; Prisma migration và generated client đã cấu hình.
- [x] Đăng nhập admin bằng Supabase Auth; NestJS kiểm tra Bearer token và allowlist `ADMIN_EMAILS`.
- [x] Route admin được bảo vệ: `GET/PUT /api/admin/resume`, `POST /api/admin/resume/publish`.
- [x] Resume Editor có form structured data: thông tin cơ bản, summary, technical skills, experience (tùy chọn), projects, education và thứ tự section.
- [x] Live preview CV React/HTML/CSS, responsive, in/trình duyệt lưu PDF, zoom và section reordering.
- [x] Lưu draft, publish CV; `ResumeVersion` tạo snapshot mỗi lần publish.
- [x] Public CV tại `/resume`; hỗ trợ CV riêng theo owner tại `/resume/[slug]`.
- [x] Resume gắn với Supabase `user.id` (`ownerId`): admin khác không ghi đè CV của nhau.
- [x] CV cũ được claim an toàn ở lần admin owner đầu tiên mở/lưu/publish, không phải nhập lại dữ liệu.
- [x] Backend Render có health check `/api/health`, Prisma deploy khi khởi động, auto-deploy từ `main`.
- [x] Frontend đã deploy Vercel; backend đã deploy Render; CORS đã cấu hình cho production Vercel URL.
- [x] Public Landing Page hoàn chỉnh: Hero, Projects, Skills, Experience, Education, Contact, kết nối trực tiếp với Backend API `getPublishedResume()`.
- [x] Resume Version History & Rollback UI: Xem lịch sử các bản snapshot đã publish, xem chi tiết và khôi phục (Rollback) bản cũ ngay trong Admin CMS.
- [x] Contact Hub & Admin Inbox: Form public tối giản (Topic, Email, Message), JD link/PDF chỉ cho Hiring, PostgreSQL inbox owner-only, rate limit, private signed PDF download và trạng thái Resend notification. Legacy public attachment URL/data đã được xoá; production UI và `/api/health` đã xác minh ngày 02/09/2026.
- [x] SEO nền tảng: metadata theo route, Open Graph/Twitter image, JSON-LD cho case study, `robots.txt` và `sitemap.xml` động gồm các project public.
- [x] Case Study SSR: trang `/projects/[slug]` có metadata riêng, cache/revalidate 5 phút, README GitHub, Mermaid diagrams, ảnh/link relative và chọn README theo từng repository của một project.
- [x] CTA Project theo URL: Source Code, Live Demo hoặc Demo Video (tự nhận diện video URL).
- [x] Public-resume snapshot và backend revalidation sau publish đã có trong source để giảm phụ thuộc trực tiếp vào API khi render public pages.

### Đang triển khai / cần xác minh sau deploy mới nhất

- [~] Cần xác minh production: Render chạy hết `prisma migrate deploy`, các biến public-resume revalidation có đủ, và publish thực sự làm mới dữ liệu Vercel.
- [~] API đã hỗ trợ custom slug, generate slug duy nhất và chặn slug hệ thống; cần xác minh UI/public URL trên production sau deploy.
- [~] GitHub Actions Quality Gate đã chạy xanh lint/test/build cho frontend và backend khi push/PR vào `main` (xác minh 02/09/2026). Cần bật branch protection để biến nó thành merge gate bắt buộc.

### Chưa triển khai

- [~] Project cards đã có thumbnail 16:9/fallback, dynamic mockup preview, visibility controls, nhiều repository, Source Code / Live Demo / Demo Video / Case Study. Case Study render README GitHub qua backend, SSR và Mermaid. Raw README HTML hiện được allowlist-sanitize, unsafe URL protocols bị chặn, Mermaid chạy strict mode và có regression tests; vẫn cần kiểm tra production/browser trước khi coi là hardened hoàn toàn. Project CMS/Storage độc lập và Request Access chưa làm.
- [ ] Template CV `Minimal` / `Modern`; hiện chỉ dùng template kỹ thuật.
- [ ] Avatar, certificates, file đính kèm và Supabase Storage.
- [~] Tự chọn public slug thân thiện: backend/API đã hỗ trợ; cần xác minh UI và production.
- [ ] Global Search / Command Palette, Dark/Light mode và accessibility audit.
- [~] SEO metadata/sitemap: đã có nền tảng; chưa có Lighthouse 90+ measurement và audit structured-data/preview trên production.
- [ ] Blog, newsletter.
- [ ] RAG, pgvector, Gemini/OpenAI fallback.
- [ ] Telegram Bot, webhook, SSE live chat.
- [~] Unit tests: backend 4 suites / 10 tests pass; frontend 1 suite / 3 tests pass. Chưa có integration/E2E cho Resume publish và Contact upload/inbox, monitoring/error tracking. GitHub Actions Quality Gate đã xanh; branch protection chưa được bật.

### Theo dõi hậu triển khai (không chặn Phase hiện tại)

- [ ] Lighthouse measurement cho Landing, Resume và Case Study; mục tiêu 90+ theo từng route.
- [ ] Keyboard/screen-reader accessibility audit cho navbar, Contact form, Resume editor và Inbox.
- [ ] Browser verification README sanitizer: Mermaid, ảnh/link relative, `<details>` và URL độc hại.
- [ ] Theo dõi Render logs/cold-start, lỗi Resend và failed notification trong Inbox sau khi có traffic thật.

## 1. Mục tiêu dự án

Xây dựng portfolio tiếng Anh, chuẩn production, thể hiện rõ năng lực Fullstack Developer Intern qua sản phẩm hoàn chỉnh, UX/UI tốt, backend thực tế, database, realtime và AI tích hợp có chủ đích.

Ưu tiên phát triển: **CV Editor & Resume Publishing**. Đây là module quản trị thực tế đầu tiên, đồng thời tạo ra một CV public và PDF luôn cập nhật.

---

## 2. Phạm vi sản phẩm

- Website chỉ sử dụng **tiếng Anh**.
- Public portfolio: Hero, Projects, Resume, Skills, Education, Contact, Blog (giai đoạn sau).
- Admin panel có xác thực để quản lý CV, Projects, Blog và dữ liệu knowledge base cho RAG.
- Dark/Light mode, Global Search, RAG assistant và Telegram live chat theo lộ trình.

---

## 3. Các module chức năng cốt lõi

### 3.1 Hero & Navigation

- Tên, role (`Fullstack Developer Intern`) và câu định vị ngắn.
- CTA: `View Projects`, `View Resume`, `Contact Me`.
- Social links: GitHub, LinkedIn, Email.
- Navbar có nút **Search** và shortcut `Ctrl + K` / `Cmd + K`.

### 3.2 Featured Projects

- Hiển thị 2–3 dự án hoàn chỉnh nhất, mỗi dự án là card và có trang case study chi tiết.
- Card gồm: thumbnail/GIF/video preview, tên, mô tả vấn đề, tech stack, vai trò, highlights.
- CTA theo tình trạng dự án, không cố định chỉ có Live Demo:
  - `Live Demo`: dùng demo environment độc lập, dữ liệu seed và tài khoản demo/read-only.
  - `Demo Video`: video ngắn thể hiện user flow chính khi không thể public app.
  - `Case Study`: kiến trúc, ERD, challenge, giải pháp và kết quả.
  - `Source Code`: GitHub repo/README đã loại bỏ secrets.
  - `Request Access`: dành cho dự án có dữ liệu nhạy cảm hoặc quyền truy cập riêng.

### 3.3 Resume Editor & Resume Publishing — ưu tiên cao nhất

#### Public Resume

- [x] Trang `/resume` hiển thị CV rõ ràng, dễ đọc với recruiter và responsive.
- [x] Có Print / browser PDF download.
- [x] Render CV từ React/HTML/CSS, print stylesheet và khổ A4.
- [x] `/resume/[slug]` hiển thị CV public riêng theo owner; `/resume` giữ tương thích cho portfolio chính.

#### Admin Resume Editor

- [x] Trang `/admin/resume` chỉ admin trong allowlist được truy cập.
- [x] Form: profile/contact, summary, experience, education, skills, projects; experience có thể để trống.
- [x] Live preview cạnh form.
- [ ] Chọn template `Minimal` hoặc `Modern` (hiện chỉ `technical`).
- [x] Lưu draft/publish, `updatedAt`, snapshot version, Version History drawer và rollback có xác nhận.
- [ ] Avatar, certificates và Supabase Storage.

#### Nguyên tắc dữ liệu và xuất PDF

- Lưu nội dung CV dưới dạng dữ liệu có cấu trúc (`JSONB`), **không lưu raw HTML**.
- React template chuyển dữ liệu đó thành HTML/CSS; điều này an toàn hơn, dễ validate và đổi giao diện mà không mất nội dung.
- MVP dùng browser print (`window.print`) để lưu PDF.
- Giai đoạn sau, NestJS tạo PDF đồng nhất bằng headless Chromium/Puppeteer khi cần file tải về do server tạo.

### 3.4 Skills, Education & Contact

- Skills phân nhóm: Frontend, Backend & Database, DevOps & Tools.
- Education, certificates, awards và hoạt động liên quan.
- [~] Contact form: Topic, Email, Message; JD link hoặc private PDF chỉ khi Hiring; validate/rate-limit, lưu PostgreSQL, inbox `/admin/inbox` owner-only và notification Resend có trạng thái. Chờ cấu hình Storage/Resend production để kiểm chứng end-to-end.

---

## 4. Tính năng mở rộng

| Tính năng              | Phạm vi                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Dark / Light Mode**  | Theo `prefers-color-scheme`, cho phép đổi thủ công và lưu preference; tránh FOUC.                                     |
| **Global Search**      | Nút Search trên navbar mở Command Palette. MVP tìm routes, projects, skills và resume sections bằng Fuse.js ở client. |
| **Project Case Study** | Hình ảnh, kiến trúc hệ thống, ERD, quyết định kỹ thuật và kết quả.                                                    |
| **Admin CMS**          | CRUD có auth cho resume, projects, posts và knowledge base.                                                           |
| **Blog & Newsletter**  | MDX/CMS, subscribe email, rate limiting và welcome email.                                                             |
| **API Healthcheck**    | Widget tùy chọn hiển thị health/latency của NestJS API.                                                               |

---

## 5. Hybrid Livechat & RAG AI Assistant

Hệ thống chat có hai chế độ: AI RAG trả lời thông tin portfolio/CV, hoặc chuyển sang live chat qua Telegram.

```
[Visitor] → [NestJS API] → [RAG: pgvector + AI provider] → AI response
                      └──→ [Telegram Bot] → [Owner reply]
                                              └──→ [Webhook] → [SSE] → [Visitor]
```

### RAG

- Knowledge base gồm CV, projects, skills, education và FAQ phỏng vấn.
- Nội dung được chia chunks, tạo embeddings và lưu trong `pgvector`.
- Retriever chọn context liên quan trước khi LLM tạo câu trả lời.
- Giai đoạn đầu gọi Gemini SDK trực tiếp; chưa đưa LangChainJS vào luồng MVP để giảm độ phức tạp. LangChainJS chỉ được thêm khi có nhu cầu orchestration rõ ràng.

### AI provider

- Gemini API là provider chính cho generation và embeddings.
- OpenAI API là fallback cho **generation** thông qua interface `AiProvider`.
- Embedding model phải được chọn cố định. Không so sánh vector từ các embedding model khác nhau; đổi model yêu cầu re-embed knowledge base.

### Livechat

- Visitor gửi tin nhắn qua chat widget; NestJS gửi Telegram Bot API khi owner takeover.
- Owner phản hồi trên Telegram; Telegram webhook gọi NestJS.
- NestJS đẩy phản hồi về client qua SSE.
- V1 chạy một instance Render; nếu scale nhiều instances thì bổ sung Redis pub/sub.

---

## 6. Kiến trúc & Tech Stack đã chốt

| Tầng hệ thống          | Công nghệ                                  | Quyết định sử dụng                                                                                    |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Frontend**           | Next.js App Router + TypeScript            | SSR/SSG, SEO, portfolio public trên Vercel.                                                           |
| **UI**                 | Tailwind CSS + shadcn/ui + Lucide Icons    | Xây giao diện và template CV bằng HTML/CSS/React.                                                     |
| **Forms**              | React Hook Form + Zod                      | Quản lý Resume Editor và validation.                                                                  |
| **Client state**       | Zustand                                    | Chỉ dùng cho UI state: Command Palette, chat widget, modal, theme. Không dùng làm server-data store.  |
| **Backend**            | NestJS                                     | REST APIs, auth guards, webhook, SSE, PDF generation về sau.                                          |
| **Database & Storage** | Supabase PostgreSQL + Supabase Storage     | Dữ liệu quan hệ, JSONB CV, files/images và pgvector.                                                  |
| **ORM**                | Prisma                                     | CRUD domain và migration; phần `pgvector` dùng custom SQL migration/raw query trong repository riêng. |
| **AI / RAG**           | Gemini API + pgvector; OpenAI API fallback | Gemini primary; OpenAI chỉ fallback generation.                                                       |
| **Realtime / Bot**     | Telegram Bot API + Webhooks + SSE          | Owner trả lời qua Telegram, visitor nhận realtime trên web.                                           |
| **Hosting**            | Vercel + Render + Supabase                 | Next.js trên Vercel; NestJS trên Render; data trên Supabase.                                          |
| **CI/CD**              | GitHub Actions                             | Chạy lint, test, build; Vercel/Render tự deploy từ nhánh production.                                  |

---

## 7. Cấu trúc Database sơ bộ

- **`users`**: Admin users và thông tin auth mapping từ Supabase Auth.
- **`profile`**: Personal info, social links, summary và metadata portfolio.
- **`resume`**: Bản CV hiện hành; `content JSONB`, `template`, `status` (`draft`/`published`), `published_at`, `updated_at`.
- **`resume_versions`**: Snapshot JSONB của từng version CV để audit và rollback.
- **`projects`**: title, slug, summary, thumbnail, tech_stack, role, featured, source_url, demo_url, video_url, case_study content và `demo_type`.
- **`posts`**: title, slug, content_mdx, tags, published_at, view_count.
- **`subscribers`**: email, status, created_at, unsubscribed_at.
- **`chat_sessions`** và **`messages`**: session visitor, history, mode (`rag`/`human`), sender và delivery state.
- **`knowledge_documents`**: source, content, metadata, checksum và trạng thái indexing.
- **`document_embeddings`**: document/chunk id, content, embedding vector, embedding model và metadata.

---

## 8. Yêu cầu phi chức năng

- **Performance/SEO:** Lighthouse mục tiêu 90+; WebP/AVIF, lazy loading, metadata, sitemap, responsive hoàn toàn.
- **Security:** secrets chỉ lưu server-side; validate input bằng Zod; rate limit Contact/Chat; Supabase RLS; webhook secret verification.
- **Availability:** Telegram webhook và SSE endpoint phải có HTTPS public; healthcheck cho NestJS.
- **Observability:** log structured, error tracking và endpoint `/health`.
- **Testing:** unit test cho business logic, integration test cho API quan trọng, E2E cho Resume Editor publish flow.

---

## 9. Lộ trình triển khai

### Phase 1 — Resume & Portfolio Core

- [x] Khởi tạo monorepo/frontend/backend, Supabase và deploy cơ bản.
- [~] Resume public + editor: structured data, draft/publish, owner isolation, preview, print/PDF browser.
- [x] Hoàn thành public pages: Hero, Projects, Skills, Education, Contact.
- [~] Project case study README GitHub, nhiều repository và CTA Source Code / Live Demo / Demo Video đã làm. Template thứ hai và Request Access chưa làm.

### Phase 2 — Admin, Search & Polish

- [x] Supabase Auth + NestJS guard cho admin và owner-specific resume.
- [~] Resume CRUD; Projects CRUD và Supabase Storage chưa làm.
- [ ] Nút Search trên navbar + Command Palette/Fuse.js.
- [~] SEO nền tảng đã làm (metadata, OG, sitemap, robots, JSON-LD); Dark/Light mode, accessibility audit, Lighthouse measurement và responsive polish còn lại.

### Phase 3 — Blog & RAG

- Blog/Newsletter nếu vẫn cần.
- Knowledge base, embedding pipeline, pgvector retrieval và Gemini RAG.
- `AiProvider` abstraction, OpenAI fallback cho generation.

### Phase 4 — Telegram Livechat & Production Hardening

- Telegram Bot, webhook verification, human takeover và SSE.
- Healthcheck, monitoring, rate limit, testing, Lighthouse 90+.
- NestJS PDF export bằng Puppeteer nếu browser print không đủ đồng nhất.
