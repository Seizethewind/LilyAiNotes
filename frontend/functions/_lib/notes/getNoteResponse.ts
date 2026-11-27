export interface NoteRow {
  id: string;
  workspace_id: string;
  note_key: string | null;
  title: string;
  summary: string;
  type: string;
  tags_json: string;
  project: string;
  scope: string;
  source: string;
  author: string;
  status: string;
  processing_status: string;
  content: string;
  version: number;
  parent_id: string | null;
  supersedes_id: string | null;
  created_by_user_id: string | null;
  created_by_key_id: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  valid_until: string | null;
  deleted_at: string | null;
}

export async function formatNoteResponse(db: D1Database, note: NoteRow) {
  const latestVersion = await db
    .prepare("SELECT change_note FROM note_versions WHERE note_id = ? ORDER BY version DESC LIMIT 1")
    .bind(note.id)
    .first<{ change_note: string }>();
  const links = await db
    .prepare("SELECT to_id FROM note_links WHERE from_id = ?")
    .bind(note.id)
    .all<{ to_id: string }>();

  let tags: string[] = [];
  try {
    const parsed = JSON.parse(note.tags_json || "[]");
    if (Array.isArray(parsed)) tags = parsed.map((t) => String(t));
  } catch {
    tags = [];
  }

  return {
    id: note.id,
    note_key: note.note_key || note.id.slice(0, 8).toUpperCase(),
    workspace_id: note.workspace_id,
    title: note.title,
    summary: note.summary,
    type: note.type,
    tags,
    project: note.project,
    scope: note.scope,
    source: note.source,
    author: note.author,
    status: note.status,
    processing_status: note.processing_status,
    content: note.content,
    version: note.version,
    change_note: latestVersion?.change_note || "Initial creation",
    parent_id: note.parent_id,
    supersedes_id: note.supersedes_id,
    related_ids: links.results.map((r) => r.to_id),
    created_at: note.created_at,
    updated_at: note.updated_at,
    verified_at: note.verified_at,
    valid_until: note.valid_until,
    deleted_at: note.deleted_at,
  };
}
