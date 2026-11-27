# API Design

> **Status: design only. Nothing here is implemented yet.** Numbers marked *(proposed)* are starting values, not tested limits.

The API is how Lily (and any other AI client) reads and writes notes. Keep it small: every extra endpoint is more surface to protect.

## Conventions

- Base path: `/api/v1`. JSON requests and responses.
- AI clients authenticate with `Authorization: Bearer <api key>`. See `SECURITY.md`.
- Humans use the website with a signed-in session. Human-only actions are never available to an API key.
- Search returns **IDs and snippets**, not full text. Fetch a note by ID only when its full text is needed.
- Search `limit` defaults to 10 and is capped at 50 *(proposed)*.
- Errors use one consistent shape: `{ "error": { "code": "...", "message": "..." } }`. Messages never expose secrets or internals.

## Note record (fields the API returns)

| Field | Meaning |
|---|---|
| `id` | Stable identifier |
| `title`, `summary` | Short description used for scanning many notes cheaply |
| `type` | `fact`, `decision`, `preference`, `procedure`, `log`, `code` |
| `project` | Subject the note belongs to |
| `source`, `author` | Who or what created it (you, Lily, import) |
| `status` | `draft`, `verified`, `disputed`, `superseded` |
| `created_at`, `verified_at`, `valid_until` | Dates, so stale facts can be ranked down |
| `parent_id`, `supersedes_id`, `related_ids` | Links to other notes (also feed the future graph view) |
| `version`, `change_note` | Version number and the reason for the latest change |
| `content` | Full text (only on `GET /notes/{id}`) |

## Endpoints for AI clients

| Endpoint | Purpose | Scope |
|---|---|---|
| `GET /notes/search?q=&project=&type=&status=&limit=` | Search. Returns id, title, summary, snippet, status, breadcrumb, updated_at. | read |
| `GET /notes/{id}` | Full note with metadata | read |
| `GET /notes/{id}/links` | Linked notes: parent, replaces, related | read |
| `GET /topics/{id}` | A topic's overview note plus its children with one-line summaries | read |
| `POST /notes` | Create a note. Always starts as `draft`. May include `supersedes_id`. | write |
| `PATCH /notes/{id}` | Save a new version with a `change_note`. Only drafts created by the same key. | write |
| `POST /notes/{id}/flag` | Mark a note wrong or disputed, or propose deletion. Does not delete. | read |
| `GET /health` | Service status | public |

### Behaviour rules

- Writes from an AI key are **always drafts**. They cannot create or promote `verified` notes.
- Editing never overwrites: each save creates a new version row. Old versions stay available.
- A note that replaces an older one links to it with `supersedes_id`. The old note becomes `superseded` and is ranked lower by default.
- Search ignores trashed notes and, by default, ranks `verified` above `draft`, and `draft` above `disputed` or `superseded`.

## Website-only endpoints (signed-in human session)

Verify or dispute a note, edit any note, delete (soft delete to trash), restore from trash, empty trash, export, manage API keys, view the audit log.

AI keys must never be able to call these, even with a write scope.

## MCP

If Lily connects through MCP, build a thin MCP server over the same endpoints, using the same keys and scopes. Do not create a second set of rules.

## Not yet decided

- Exact pagination format for search results.
- Whether `PATCH` may also be used by a human key on non-draft notes, or only through the website.
