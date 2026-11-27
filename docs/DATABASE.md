# Database Design

The active database engine is **Cloudflare D1 (SQLite + FTS5)** managed via `frontend/migrations/0001_initial_schema.sql`. The database stays usable even if every AI provider is unavailable.

## Core rules

1. Content is never overwritten. Every edit creates a new `note_versions` row.
2. Deleting is a **soft delete** (`deleted_at`). Trashed notes are hidden from search and from AI clients and can be restored by humans.
3. Embeddings are derived data. Keyword and structural search via FTS5 work with zero external AI providers.
4. Every schema change goes through a D1 SQL migration in `frontend/migrations/`.
5. Related writes execute atomically in `env.DB.batch([...])`.

## Tables (`frontend/migrations/0001_initial_schema.sql`)

### `users`, `workspaces`, `workspace_members`

Account identities (`PBKDF2-SHA256` hashed passwords via Web Crypto), workspace slugs, and membership roles.

### `notes`

One row per note holding current state: `id`, `workspace_id`, `title`, `summary`, `type` (`fact`, `decision`, `preference`, `procedure`, `log`, `code`), `project`, `scope` (`global`, `project`, `agent`, `private`), `source`, `author`, `status` (`draft`, `verified`, `disputed`, `superseded`), `processing_status`, `content` (UTF-8), `content_hash` (SHA-256 of normalized text), `storage_key` (R2 object key for uploaded originals), `version`, `parent_id`, `supersedes_id`, `created_by_user_id`, `created_by_key_id`, `created_at`, `updated_at`, `verified_at`, `valid_until`, `deleted_at`.

### `note_versions`

Immutable edit history (`note_id`, `version`, `content`, `change_note`, `edited_by`, `created_at`). Every `PATCH` records `change_note`.

### `note_links`

Directed edges between notes (`from_id`, `to_id`, `kind`: `related`, `replaces`, etc.).

### `chunks` & `chunks_fts`

Derived Markdown heading-path chunks (`chunks`) mirrored into an SQLite FTS5 virtual table (`chunks_fts`) for fast full-text indexing. Rebuilt atomically whenever a note is created or edited.

### `api_keys` & `audit_log`

- `api_keys`: `id`, `workspace_id`, `user_id`, `name`, `key_prefix`, `key_hash` (SHA-256 hex, plaintext shown once at creation), `scope` (`read` or `read+write`), `created_at`, `last_used_at`, `revoked_at`.
- `audit_log`: Append-only record of registrations, logins, note writes/flags/verifications/deletions/restores, trash purges, workspace creation, and API key lifecycle events.

## Indexes & Ranking

- Partial unique index `uq_notes_active_hash` on `(workspace_id, project, content_hash) WHERE deleted_at IS NULL` prevents active duplicates while allowing replacement after trash.
- Composite index `idx_notes_filter` on `(workspace_id, project, type, status, deleted_at)`.
- Search (`searchNotes`) matches `chunks_fts` + title/summary metadata and ranks `verified` > `draft` > `disputed` > `superseded`, boosting title and summary matches.
