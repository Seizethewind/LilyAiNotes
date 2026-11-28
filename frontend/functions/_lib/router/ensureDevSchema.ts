const SCHEMA_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member', is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, owner_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS workspace_members (workspace_id TEXT NOT NULL REFERENCES workspaces(id), user_id TEXT NOT NULL REFERENCES users(id), role TEXT NOT NULL DEFAULT 'editor', created_at TEXT NOT NULL, PRIMARY KEY (workspace_id, user_id))",
  "CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id), user_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, key_prefix TEXT NOT NULL, key_hash TEXT NOT NULL UNIQUE, scope TEXT NOT NULL, allowed_project TEXT, created_at TEXT NOT NULL, last_used_at TEXT, revoked_at TEXT)",
  "CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id), note_key TEXT, title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'fact', tags_json TEXT NOT NULL DEFAULT '[]', project TEXT NOT NULL DEFAULT 'general', scope TEXT NOT NULL DEFAULT 'project', source TEXT NOT NULL DEFAULT 'human', author TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', processing_status TEXT NOT NULL DEFAULT 'ready', processing_error TEXT, content TEXT NOT NULL, content_hash TEXT NOT NULL, storage_key TEXT, version INTEGER NOT NULL DEFAULT 1, parent_id TEXT, supersedes_id TEXT, created_by_user_id TEXT, created_by_key_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, verified_at TEXT, valid_until TEXT, deleted_at TEXT)",
  "CREATE INDEX IF NOT EXISTS idx_notes_filter ON notes(workspace_id, project, type, status, deleted_at)",
  "CREATE INDEX IF NOT EXISTS idx_notes_scope_type ON notes(workspace_id, scope, type, deleted_at)",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_notes_workspace_key ON notes(workspace_id, note_key) WHERE note_key IS NOT NULL",
  "CREATE INDEX IF NOT EXISTS idx_notes_workspace_key_lookup ON notes(workspace_id, UPPER(note_key))",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_notes_active_hash ON notes(workspace_id, project, content_hash) WHERE deleted_at IS NULL",
  "CREATE TABLE IF NOT EXISTS note_counters (workspace_id TEXT NOT NULL, prefix TEXT NOT NULL, next_value INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (workspace_id, prefix))",
  "CREATE TABLE IF NOT EXISTS note_tags (workspace_id TEXT NOT NULL, note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE, tag TEXT NOT NULL, PRIMARY KEY (workspace_id, note_id, tag))",
  "CREATE INDEX IF NOT EXISTS idx_note_tags_lookup ON note_tags(workspace_id, tag)",
  "CREATE TABLE IF NOT EXISTS note_versions (id TEXT PRIMARY KEY, note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE, version INTEGER NOT NULL, content TEXT NOT NULL, change_note TEXT NOT NULL, edited_by TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS note_links (id TEXT PRIMARY KEY, from_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE, to_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE, kind TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY, note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE, version INTEGER NOT NULL, position INTEGER NOT NULL, heading_path TEXT NOT NULL DEFAULT '', text TEXT NOT NULL, context_prefix TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)",
  "CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(chunk_id UNINDEXED, note_id UNINDEXED, title, summary, context_prefix, text)",
  "CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, workspace_id TEXT, actor_type TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, details TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL)",
];

let schemaBootstrapped = false;

export async function ensureDevSchema(db: D1Database): Promise<void> {
  if (schemaBootstrapped) return;
  const check = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .first<{ name: string }>();
  if (!check) {
    for (const stmt of SCHEMA_STATEMENTS) {
      await db.prepare(stmt).run();
    }
  } else {
    const cols = await db.prepare("PRAGMA table_info(notes)").all<{ name: string }>();
    const names = new Set(cols.results.map((c) => c.name));
    if (!names.has("note_key")) await db.prepare("ALTER TABLE notes ADD COLUMN note_key TEXT").run();
    if (!names.has("tags_json")) await db.prepare("ALTER TABLE notes ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'").run();
    const keyCols = await db.prepare("PRAGMA table_info(api_keys)").all<{ name: string }>();
    const keyNames = new Set(keyCols.results.map((c) => c.name));
    if (!keyNames.has("allowed_project")) await db.prepare("ALTER TABLE api_keys ADD COLUMN allowed_project TEXT").run();
    for (const stmt of SCHEMA_STATEMENTS.slice(6, 14)) {
      await db.prepare(stmt).run();
    }
  }
  schemaBootstrapped = true;
}
