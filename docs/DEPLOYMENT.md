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
   - `APP_SECRET_KEY` *(required)*: Random 32+ byte secret for HMAC session signing. Without it, sign-in and session requests return 503.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` *(optional)*: Enable Google sign-in. See below.
   - `COOKIE_SECURE`: `"true"` in production.
   - `GEMINI_API_KEY` *(optional)*: Enables `/api/v1/assistant/chat` (`gemini-4-hydrogen`) server-side.
   - `BACKUP_ENCRYPTION_KEY` *(optional)*: Used only if deploying `frontend/wrangler.cron.toml` separately.

## Google Sign-in Setup (optional)

Only identity is requested (`openid email profile`). This does **not** grant Drive or Gmail access, and no Google tokens are stored.

1. In Google Cloud Console, configure the OAuth consent screen. While the app is in testing, add each allowed account as a test user.
2. Create an OAuth client ID of type **Web application**.
3. Add each exact redirect URI: `https://<your-domain>/api/v1/auth/google/callback`. For local Pages dev, add `http://localhost:8788/api/v1/auth/google/callback` (use port 3000 for `npm run dev`).
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as Cloudflare secrets (locally, `frontend/.dev.vars`).
5. Run `npm --prefix frontend run db:migrate:remote` to apply `0004_user_identities.sql` **before** deploying this code.

A Google sign-in is never linked to an existing password account just because the email matches. Sign in with the password, then use **Settings > Connect Google account**. A first-time Google user with a new email gets a new account and workspace.

## Portable Text Backups

Signed-in humans can download complete workspace or per-project snapshots directly in Markdown (`.md`) or JSON (`.json`) via `/api/v1/exports` from **Documents** or **Settings**.
