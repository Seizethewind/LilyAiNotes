import { buildAuditStatement } from "../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../_lib/http/jsonResponse";
import { formatNoteResponse } from "../../_lib/notes/getNoteResponse";
import type { NoteRow } from "../../_lib/notes/getNoteResponse";
import type { Env } from "../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const rows = await env.DB.prepare(
    "SELECT * FROM notes WHERE workspace_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC",
  )
    .bind(principal.workspaceId)
    .all<NoteRow>();
  const items = await Promise.all(rows.results.map((row) => formatNoteResponse(env.DB, row)));
  return jsonResponse(items);
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const trashed = await env.DB.prepare(
    "SELECT id FROM notes WHERE workspace_id = ? AND deleted_at IS NOT NULL",
  )
    .bind(principal.workspaceId)
    .all<{ id: string }>();

  if (trashed.results.length === 0) {
    return jsonResponse({ deleted_count: 0 });
  }

  const stmts: D1PreparedStatement[] = [];
  for (const row of trashed.results) {
    stmts.push(env.DB.prepare("DELETE FROM chunks_fts WHERE note_id = ?").bind(row.id));
    stmts.push(env.DB.prepare("DELETE FROM notes WHERE id = ? AND workspace_id = ?").bind(row.id, principal.workspaceId));
  }
  stmts.push(
    buildAuditStatement(env.DB, {
      workspaceId: principal.workspaceId,
      actorType: "human",
      actorId: principal.subjectId,
      action: "note.empty_trash",
      resourceType: "note",
      resourceId: principal.workspaceId,
      details: { deleted_count: trashed.results.length },
    }),
  );
  await env.DB.batch(stmts);
  return jsonResponse({ deleted_count: trashed.results.length });
};
