import { DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT } from "../types/env";
import type { NoteRow } from "./getNoteResponse";
import { resolveNoteOrderBy } from "./resolveNoteOrderBy";

const STATUS_WEIGHTS: Record<string, number> = {
  verified: 40,
  draft: 25,
  disputed: 10,
  superseded: 5,
};

export interface SearchNotesParams {
  q?: string;
  project?: string;
  type?: string;
  scope?: string;
  status?: string;
  tag?: string;
  sortBy?: string;
  sortDir?: string;
  limit?: number;
}

export async function searchNotes(db: D1Database, workspaceId: string, params: SearchNotesParams) {
  const capped = Math.max(1, Math.min(params.limit || DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT));
  const query = (params.q || "").trim();

  const clauses = ["workspace_id = ?", "deleted_at IS NULL"];
  const binds: unknown[] = [workspaceId];

  if (params.project) {
    clauses.push("project = ?");
    binds.push(params.project);
  }
  if (params.type) {
    clauses.push("type = ?");
    binds.push(params.type);
  }
  if (params.scope) {
    clauses.push("scope = ?");
    binds.push(params.scope);
  }
  if (params.status) {
    clauses.push("status = ?");
    binds.push(params.status);
  }
  if (params.tag) {
    clauses.push("id IN (SELECT note_id FROM note_tags WHERE workspace_id = ? AND tag = ?)");
    binds.push(workspaceId, params.tag.toLowerCase());
  }
  if (query) {
    const ftsSafe = `"${query.replace(/"/g, '""')}"`;
    clauses.push(
      "(UPPER(COALESCE(note_key, '')) LIKE UPPER(?) OR id IN (SELECT note_id FROM chunks_fts WHERE chunks_fts MATCH ?) OR title LIKE ? OR summary LIKE ? OR tags_json LIKE ?)",
    );
    binds.push(`${query}%`, ftsSafe, `%${query}%`, `%${query}%`, `%${query.toLowerCase()}%`);
  }

  const orderBy = params.sortBy ? resolveNoteOrderBy(params.sortBy, params.sortDir) : "updated_at DESC";
  const sql = `SELECT * FROM notes WHERE ${clauses.join(" AND ")} ORDER BY ${orderBy} LIMIT 200`;
  const rows = await db.prepare(sql).bind(...binds).all<NoteRow>();
  const qLower = query.toLowerCase();

  const ordered = params.sortBy
    ? rows.results.slice(0, capped)
    : [...rows.results]
        .sort((a, b) => {
          const keyA = (a.note_key || "").toLowerCase();
          const keyB = (b.note_key || "").toLowerCase();
          const scoreA =
            (STATUS_WEIGHTS[a.status] || 0) +
            (qLower && keyA === qLower ? 120 : qLower && keyA.startsWith(qLower) ? 80 : 0) +
            (qLower && a.title.toLowerCase().includes(qLower) ? 30 : 0) +
            (qLower && a.summary.toLowerCase().includes(qLower) ? 15 : 0) +
            (qLower && a.tags_json.toLowerCase().includes(qLower) ? 20 : 0);
          const scoreB =
            (STATUS_WEIGHTS[b.status] || 0) +
            (qLower && keyB === qLower ? 120 : qLower && keyB.startsWith(qLower) ? 80 : 0) +
            (qLower && b.title.toLowerCase().includes(qLower) ? 30 : 0) +
            (qLower && b.summary.toLowerCase().includes(qLower) ? 15 : 0) +
            (qLower && b.tags_json.toLowerCase().includes(qLower) ? 20 : 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return b.updated_at.localeCompare(a.updated_at);
        })
        .slice(0, capped);

  return ordered.map((n) => {
    const rawSnippet = (n.summary || n.content).replace(/\n+/g, " ").trim();
    const noteKey = n.note_key || n.id.slice(0, 8).toUpperCase();
    let tags: string[] = [];
    try {
      tags = JSON.parse(n.tags_json || "[]") as string[];
    } catch {
      tags = [];
    }
    return {
      id: n.id,
      note_key: noteKey,
      title: n.title,
      summary: n.summary,
      snippet: rawSnippet.length > 220 ? `${rawSnippet.slice(0, 220)}...` : rawSnippet,
      type: n.type,
      tags,
      project: n.project,
      scope: n.scope,
      status: n.status,
      breadcrumb: `${noteKey} · ${n.project} > ${n.title} > v${n.version}`,
      version: n.version,
      updated_at: n.updated_at,
    };
  });
}
