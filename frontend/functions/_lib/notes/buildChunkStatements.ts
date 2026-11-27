import { chunkMarkdown } from "../processing/chunkMarkdown";

export function buildChunkStatements(
  db: D1Database,
  note: { id: string; title: string; summary: string; content: string; version: number },
): D1PreparedStatement[] {
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [
    db.prepare("DELETE FROM chunks_fts WHERE note_id = ?").bind(note.id),
    db.prepare("DELETE FROM chunks WHERE note_id = ?").bind(note.id),
  ];
  const drafts = chunkMarkdown(note.title, note.summary, note.content);
  for (const draft of drafts) {
    const chunkId = crypto.randomUUID();
    stmts.push(
      db
        .prepare(
          "INSERT INTO chunks (id, note_id, version, position, heading_path, text, context_prefix, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(chunkId, note.id, note.version, draft.position, draft.headingPath, draft.text, draft.contextPrefix, now),
    );
    stmts.push(
      db
        .prepare(
          "INSERT INTO chunks_fts (chunk_id, note_id, title, summary, context_prefix, text) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(chunkId, note.id, note.title, note.summary, draft.contextPrefix, draft.text),
    );
  }
  return stmts;
}
