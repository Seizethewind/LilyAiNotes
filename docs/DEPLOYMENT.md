# Deployment and Data Protection Design

LilyAiDataNotes deploys as a single unified **Cloudflare Pages** project configured for **D1-only text storage** (no R2 buckets required).

## Cloudflare Pages Git Integration Settings

When connecting this repository to Cloudflare Pages:

| Setting | Value |
|---|---|
| **Framework preset** | `Remix` (or `None` using custom command) |
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Build output directory** | `build/client` |
| **Node.js version** | `22` (`NODE_VERSION = "22"`) |
| **Compatibility flags** | `nodejs_compat` (`frontend/wrangler.toml`) |

## Required Cloudflare Bindings & Secrets

1. **D1 Database (`DB`):**
   ```bash
   npx wrangler d1 create lilyaidatanotes-db
   npm --prefix frontend run db:migrate:remote
   ```
   Set the created `database_id` inside `frontend/wrangler.toml`, and attach the `DB` binding in **Cloudflare Pages > Settings > Functions > D1 database bindings**.
2. **Environment Secrets (Cloudflare Pages > Settings > Environment variables):**
   - `APP_SECRET_KEY`: Random 32+ byte secret for HMAC session signing.
   - `COOKIE_SECURE`: `"true"` in production.
   - `GEMINI_API_KEY` *(optional)*: Enables `/api/v1/assistant/chat` (`gemini-4-hydrogen`) server-side.
   - `BACKUP_ENCRYPTION_KEY` *(optional)*: Used only if deploying `frontend/wrangler.cron.toml` separately.

## Portable Text Backups

Signed-in humans can download complete workspace or per-project snapshots directly in Markdown (`.md`) or JSON (`.json`) via `/api/v1/exports` from **Documents** or **Settings**.
