import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { requireWriteScope } from "../../../_lib/auth/requireWriteScope";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../_lib/http/parseJsonBody";
import { createNote } from "../../../_lib/notes/createNote";
import type { CreateNoteInput } from "../../../_lib/notes/createNote";
import { formatNoteResponse } from "../../../_lib/notes/getNoteResponse";
import type { NoteRow } from "../../../_lib/notes/getNoteResponse";
import { resolveNoteOrderBy } from "../../../_lib/notes/resolveNoteOrderBy";
import type { Env } from "../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = await authenticateRequest(request, env);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const project = url.searchParams.get("project");
  const noteType = url.searchParams.get("type");
  const scope = url.searchParams.get("scope");
  const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();
  const sortBy = url.searchParams.get("sort_by");
  const sortDir = url.searchParams.get("sort_dir");
  const rawLimit = Number(url.searchParams.get("limit") || 100);
  const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 100, 100));

  const clauses = ["workspace_id = ?", "deleted_at IS NULL"];
  const binds: unknown[] = [principal.workspaceId];
  if (status) {
    clauses.push("status = ?");
    binds.push(status);
  }
  if (project) {
    clauses.push("project = ?");
    binds.push(project);
  }
  if (noteType) {
    clauses.push("type = ?");
    binds.push(noteType);
  }
  if (scope) {
    clauses.push("scope = ?");
    binds.push(scope);
  }
  if (tag) {
    clauses.push("id IN (SELECT note_id FROM note_tags WHERE workspace_id = ? AND tag = ?)");
    binds.push(principal.workspaceId, tag);
  }
  binds.push(limit);

  const orderBy = resolveNoteOrderBy(sortBy, sortDir);
  const sql = `SELECT * FROM notes WHERE ${clauses.join(" AND ")} ORDER BY ${orderBy} LIMIT ?`;
  const rows = await env.DB.prepare(sql).bind(...binds).all<NoteRow>();
  const items = await Promise.all(rows.results.map((row) => formatNoteResponse(env.DB, row)));
  return jsonResponse(items);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireWriteScope(await authenticateRequest(request, env));
  const body = await parseJsonBody<CreateNoteInput>(request);
  const created = await createNote(env.DB, principal, body);
  return jsonResponse(created, 201);
};
