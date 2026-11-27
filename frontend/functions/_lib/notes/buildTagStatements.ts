export function buildTagStatements(
  db: D1Database,
  workspaceId: string,
  noteId: string,
  tags: string[],
): D1PreparedStatement[] {
  const stmts: D1PreparedStatement[] = [
    db.prepare("DELETE FROM note_tags WHERE workspace_id = ? AND note_id = ?").bind(workspaceId, noteId),
  ];

  for (const tag of tags) {
    stmts.push(
      db
        .prepare("INSERT OR IGNORE INTO note_tags (workspace_id, note_id, tag) VALUES (?, ?, ?)")
        .bind(workspaceId, noteId, tag),
    );
  }

  return stmts;
}
