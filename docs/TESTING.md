# Testing Strategy

All unit, security, API integration, and Remix UI tests run in Vitest (`frontend/tests/`) with real SQLite + FTS5 execution via Node's built-in `node:sqlite` (`DatabaseSync`) implementing the Cloudflare `D1Database` interface alongside an in-memory `R2Bucket` implementation.

## Test Suites (`frontend/tests/`)

- **Unit (`tests/unit/`):**
  - `validationAndChunking.test.ts`: UTF-8 validation, 100 KB limit, secret scanning, text normalization, magic-byte upload checks, and Markdown heading-path chunking.
  - `backupGuards.test.ts`: AES-256-GCM round-trip, empty-database backup refusal, sharp note-count drop refusal, non-empty restore guard, and wipe-and-recover preserving `deleted_at`.
- **Security (`tests/security/`):**
  - `securityBoundaries.test.ts`: Verifies AI keys cannot call human-only routes (`/keys`, `/audit`, `/verify`, `DELETE /notes/:id`), write-scoped keys cannot create `verified` notes, read-only keys cannot write, revoked keys return `401`, and notes containing secrets are rejected (`422`).
- **API Lifecycle (`tests/api/`):**
  - `notesLifecycle.test.ts`: `/api/v1/health`, user registration/login, note creation, immutable `note_versions` edits, FTS5 search snippets, flag/verify, soft delete, trash restore, empty trash, and R2 upload archival.
- **Frontend Components & Integration (`tests/components/`, `tests/routes/`, `tests/integration/`):**
  - `StatusLabel.test.tsx`, `LoginRoute.test.tsx`, and `apiClient.test.ts`.

## Quality Gates

- `python3 scripts/validation/check_line_limits.py` enforces the 200-line limit on all non-Markdown files.
- CI workflows in `.github/workflows/` run `tsc --noEmit`, ESLint, Vitest, `remix vite:build`, line-limit validation, and a zero-`src`-directory check.
