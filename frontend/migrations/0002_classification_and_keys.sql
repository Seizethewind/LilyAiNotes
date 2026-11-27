ALTER TABLE notes ADD COLUMN note_key TEXT;
ALTER TABLE notes ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';

CREATE UNIQUE INDEX IF NOT EXISTS uq_notes_workspace_key
  ON notes(workspace_id, note_key)
  WHERE note_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notes_scope_type
  ON notes(workspace_id, scope, type, deleted_at);

CREATE TABLE IF NOT EXISTS note_counters (
  workspace_id TEXT NOT NULL,
  prefix TEXT NOT NULL,
  next_value INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (workspace_id, prefix)
);

CREATE TABLE IF NOT EXISTS note_tags (
  workspace_id TEXT NOT NULL,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (workspace_id, note_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_lookup
  ON note_tags(workspace_id, tag);
