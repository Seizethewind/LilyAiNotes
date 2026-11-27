# LilyAiDataNotes

Persistent text-only knowledge vault, versioned document manager, and scoped AI agent API built as a unified **TypeScript/JavaScript Cloudflare Pages** application (**Remix UI + Cloudflare Pages Functions `/api/v1/*` + Cloudflare D1 FTS5**), with **zero `src/` directories**.

## Implemented Features

- **Cloudflare Pages Functions (`frontend/functions/api/v1/`):** Same-origin `/api/v1` API backed exclusively by Cloudflare D1 (`frontend/migrations/0001_initial_schema.sql`), Web Crypto PBKDF2 password hashing, HMAC-SHA256 signed sessions, scoped (`read` / `read+write`) SHA-256 hashed AI API keys, note CRUD with immutable `note_versions`, topic/supersedes links, soft delete + trash restore, secret scanning, UTF-8 text file import, FTS5 search ranking, Markdown/JSON export (`/api/v1/exports`), FTS5-grounded assistant (`/api/v1/assistant/chat`), and append-only `audit_log`.
- **Remix Frontend (`frontend/app/`):** Configured for Cloudflare Pages Git builds (`frontend` root, `npm run build`, `build/client` output) with responsive mobile drawer, `/login`, `/dashboard`, `/documents` (project filter, search, create/import, topic & supersedes links, edit with `change_note`, version history, verify/dispute/flag, single-note & project export, trash), `/assistant` (grounded Q&A with clickable note citations), and `/settings` (scoped API keys, workspace export, audit log).

## Cloudflare Pages Git Build Settings

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Build output directory:** `build/client`
- **D1 Binding:** `DB` (`lilyaidatanotes-db`)

See `docs/DEVELOPMENT.md`, `docs/DEPLOYMENT.md`, and `docs/TESTING.md` for local testing and deployment details.
