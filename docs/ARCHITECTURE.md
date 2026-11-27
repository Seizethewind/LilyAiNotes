# Architecture Overview

LilyAiDataNotes is a persistent, provider-independent text knowledge platform for humans and AI agents, deployed as a unified TypeScript/JavaScript application on **Cloudflare Pages**.

## Core Boundaries

1. **Cloudflare D1 (SQLite + FTS5) is the sole source of truth.** Notes, imported text files, immutable edit history (`note_versions`), links (`note_links`), derived search chunks (`chunks` + `chunks_fts`), scoped API keys (`api_keys`), and append-only audit logs (`audit_log`) live in D1 (`frontend/migrations/0001_initial_schema.sql`).
2. **Cloudflare Pages Functions is the authoritative access layer.** All `/api/v1/*` authentication, authorization, secret scanning, UTF-8 validation, chunking, search ranking, Markdown/JSON exports, and grounded AI assistant requests run server-side inside `frontend/functions/api/v1/`.
3. **Provider-Isolated AI Assistant.** `@google/genai` (`gemini-4-hydrogen`) is isolated inside `frontend/functions/_lib/ai/askGeminiWithNotes.ts`. Search retrieval runs against D1 FTS5 first, and note text is passed strictly inside untrusted-data delimiters.
4. **Remix on Cloudflare Pages is the presentation layer.** It shares the same origin with `/api/v1`, includes a responsive mobile drawer, and keeps auth tokens out of browser `localStorage` (`httpOnly` session cookie + in-memory token).
5. **Repository & Coding Discipline.** Zero `src/` directories exist anywhere in the repository; implementation source files keep one primary function per file, and every non-Markdown file stays at or below 200 lines (`scripts/validation/check_line_limits.py`).
