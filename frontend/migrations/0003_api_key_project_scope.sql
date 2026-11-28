ALTER TABLE api_keys ADD COLUMN allowed_project TEXT;

CREATE INDEX IF NOT EXISTS idx_notes_workspace_key_lookup
  ON notes(workspace_id, UPPER(note_key));
