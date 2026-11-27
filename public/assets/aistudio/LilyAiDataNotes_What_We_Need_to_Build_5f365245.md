# LilyAiDataNotes: What We Need to Build

Nov 27, 2026 · @LilyAi

## Verdict

Nothing runs yet: 208 of 216 tracked files are empty, so the build starts from zero code, guided by a detailed design in `CLAUDE.md` and five short docs. The plan is sound and modular; the work is turning the folder tree into a thin working slice before adding depth.

Top three priorities:

1. **A runnable skeleton end to end.** FastAPI health check, Postgres with migrations, a Remix page that calls the API, and CI that passes.
2. **Safe notes storage.** Auth, workspaces, document CRUD with soft delete and versions, then the backup and restore-on-boot design from `DEPLOYMENT.md`.
3. **Retrieval and the assistant last.** Embeddings, hybrid search, memory and the provider layer only after the data layer is trustworthy.

## Current state

Only documentation and folder structure exist; every source file, config and pipeline is an empty stub.

| Area | Today | Needed |
| --- | --- | --- |
| Design | `CLAUDE.md` (about 34 KB) | Keep as the spec; trim into `ARCHITECTURE.md` |
| Docs with content | `API`, `DATABASE`, `DEPLOYMENT`, `SECURITY`, `DOCUMENT_PROCESSING` | Verify against code as it lands |
| Docs still empty | `ARCHITECTURE`, `AI_PROVIDERS`, `DEVELOPMENT`, `MEMORY`, `TESTING`, `WEBCONTAINERS` | Write as each area is built |
| Backend | Module tree under `backend/src/lilyaidatanotes`, all empty | Everything in the Backend section |
| Frontend | Route files and `app/` folders, all empty | Everything in the Frontend section |
| Config | Empty `package.json`, `pyproject.toml`, `vite.config.ts`, `tsconfig.json` | Real dependencies and scripts |
| Containers | Empty `Dockerfile`s and `docker-compose.yml` | Local dev stack and Render image |
| CI | Three empty workflows (backend, frontend, code quality) | Lint, type check, tests on every PR |
| README | One line | Setup, run and deploy steps |

The design is thorough, so most early decisions are already made; the gap is implementation.

## Backend (FastAPI on Render)

The backend needs a working app core first, then one vertical slice per domain module.

- **Project setup:** `pyproject.toml` with FastAPI, Pydantic, SQLAlchemy, Alembic, a Postgres driver, pytest and a linter; a `Dockerfile` that runs migrations then starts the server.
- **App core:** `main.py` app factory, `config/settings.py` reading environment variables, structured logging, `api/router.py` mounting `/api/v1`, and the exception handlers.
- **Database layer:** `database/session.py`, `base.py` and `health.py`, plus the first Alembic migration (the `versions/` folder is empty).
- **Auth:** password hashing, tokens, authentication and authorization in `auth/`, with workspace-level permissions.
- **Domain modules:** model, repository, schema and service for `users`, `workspace`, `documents` (with `versioning`), `conversations`, `knowledge` and `memory`.
- **API v1 routes:** the stub files `users`, `workspaces`, `documents`, `knowledge`, `memory`, `conversations`, `assistant`, `providers` and `exports` each need real endpoints, matching `docs/API.md`.
- **Worker:** `worker/main.py` for document processing, indexing and the five-minute backup upload.
- **Audit:** the `audit/` module for who changed what.

Until the core and one module (documents) work, leave the other modules as stubs.

## Database and retrieval

PostgreSQL is the source of truth, so the schema and its protections come before any AI feature.

- **Schema and migrations:** tables for users, workspaces, documents, versions, chunks, conversations and memory, created through Alembic only.
- **Soft delete and versions:** a `deleted_at` column and version history, which the backup design relies on so restores do not revive trashed notes.
- **Extensions:** confirm `pgvector` is available on the chosen Render Postgres plan before designing around it.
- **Search:** a full-text index first, since it is simple and useful alone; add vector search and hybrid ranking in `retrieval/` afterwards.
- **Document processing:** extraction, normalization and chunking pipelines, starting with plain text and Markdown. PDF, Office, image, audio and video extractors can wait.
- **Database users:** a least-privilege app user and a separate admin user for migrations, as `DEPLOYMENT.md` requires.

## Frontend (Remix on Cloudflare)

The frontend is the emptiest part and needs a real project before any page.

- **Project setup:** `package.json`, `vite.config.ts` and `tsconfig.json`, with Remix, React and TypeScript, plus a test runner for the `tests/` folders.
- **Cloudflare target:** the Cloudflare adapter, an edge-compatible `entry.server.tsx`, `wrangler.toml`, and `.dev.vars` for local secrets.
- **WebContainers headers:** COOP and COEP in a `_headers` file, with matching CORS and CORP headers on the API so cross-origin calls are not blocked.
- **Shared plumbing:** `services/api` client, `services/authentication`, `services/streaming` for assistant output, and a root layout with navigation.
- **Routes:** `login`, `dashboard`, `documents`, `knowledge`, `memory`, `conversations`, `assistant`, `workspace` and `settings`. Build `login`, `dashboard` and `documents` first.
- **WebContainers workspace:** the editor, file system, terminal, preview and runtime boot code under `app/workspace/`. Treat it as its own phase, after the document manager works.
- **Domain:** put the app and API on subdomains of one domain so cookies work across both.

## AI layer

Models must stay replaceable, so build the interfaces before any single provider.

- **Provider interface:** a common contract in `ai/interfaces` and `providers/llm`, with one adapter first (pick the provider you already use) and a registry in `providers/registry.py`.
- **Embeddings:** a separate provider interface in `providers/embeddings`, so changing the embedding model is a re-index, not a rewrite.
- **Context builder and RAG:** `ai/context_builder` and `ai/orchestration` that pull from retrieval and memory, with prompts kept in `ai/prompts`.
- **Streaming:** server-sent responses from `ai/streaming` to the frontend assistant route.
- **Tools:** `ai/tools` so the assistant can search, read and organize documents, always through the same permission checks as a user.
- **Agent access:** token-based API access scoped to a workspace, so other AI agents can read authorized knowledge, which is the project's core promise.
- **Memory:** scopes, retrieval, consolidation and policies in `memory/`, after plain retrieval works; `docs/MEMORY.md` is still empty and needs writing first.

## Infrastructure, security and CI

Protecting the data matters more than any feature, so these items are part of the core build, not polish.

| Area | What to build |
| --- | --- |
| Render | Web service for the API, a background worker, a paid Postgres database, environment variables for secrets |
| Cloudflare | Pages or Workers project for the frontend, custom domain, `_headers`; R2 bucket for off-site backups |
| Backups | Five-minute incremental upload, nightly full snapshot, readable export, encryption, restore on boot into an empty database only |
| Backup guards | Refuse an empty-database upload, never overwrite files, write-only backup credentials |
| Security | Follow `docs/SECURITY.md`: validated uploads in `storage/file_validation`, rate limits, secrets only in environment variables |
| Local dev | `docker-compose.yml` with Postgres and pgvector, plus `Makefile` targets for run, test, lint and migrate |
| CI | Fill the three workflows: backend tests, frontend tests, and code quality |
| Testing | pytest for unit, API, integration and security; frontend route and component tests; a monthly restore drill |

`DEPLOYMENT.md` currently names Render only and is marked design-only, so update it for the Cloudflare split.

## Build order and open questions

Each phase ends with something that runs and is deployed, so problems on Render or Cloudflare show up early.

1. **Skeleton:** real `package.json`, `pyproject.toml`, Dockerfiles, compose file and CI. Done when a health endpoint and a Remix page both deploy.
2. **Accounts and workspaces:** auth, users, workspaces, permissions. Done when you can sign in from the Cloudflare site against the Render API.
3. **Documents:** CRUD, soft delete, versions, the document manager UI. Done when notes survive a redeploy.
4. **Data protection:** backup worker, R2 upload, restore on boot, the guards. Done when a wiped scratch database recovers by itself.
5. **Search:** full-text, then embeddings and hybrid retrieval, with the knowledge browser UI.
6. **Assistant:** provider adapter, RAG, streaming, tools, then memory.
7. **WebContainers workspace:** editor, terminal and preview.
8. **Agent API and extras:** scoped agent access, exports, audit views, extra file extractors.

**Open questions**

- [ ] Which LLM and embedding provider comes first?
- [ ] Is this single-user for now, or multi-user from day one?
- [ ] Frontend on Cloudflare Pages or Workers?
- [ ] Which custom domain will the app and API share?
- [ ] Which Render plan, given the need for paid Postgres and pgvector?
