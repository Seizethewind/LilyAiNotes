# Development & Testing Guide

All application code (Remix UI, Pages Functions `/api/v1/*`, D1 migrations, and Cron Worker) lives in `frontend/` using TypeScript/JavaScript with **no `src/` directories**.

## Local Development

1. Copy environment templates:
   ```bash
   cp .env.example .env
   cp frontend/.dev.vars.example frontend/.dev.vars
   ```
2. Install dependencies and apply local D1 migrations:
   ```bash
   npm --prefix frontend install
   npm --prefix frontend run db:migrate:local
   ```
3. Run the unified Cloudflare Pages local server (Remix + Pages Functions + local D1/R2):
   ```bash
   make pages-dev
   ```
   Or run the Vite dev server on port 3000:
   ```bash
   make dev
   ```

## Verification Commands

- TypeScript typecheck and ESLint: `make lint`
- Full Vitest suite (UI, validation, security boundaries, backup guards, SQLite FTS5 API lifecycle): `make test`
- Production build: `make build`
- 200-line file limit check: `make check-limits`
