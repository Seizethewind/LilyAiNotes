import { buildAuditStatement } from "../../../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { formatNoteResponse } from "../../../../_lib/notes/getNoteResponse";
import type { NoteRow } from "../../../../_lib/notes/getNoteResponse";
import { AppError } from "../../../../_lib/types/env";
import type { Env } from "../../../../_lib/types/env";

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const noteId = String(params.id || "");

  const existing = await env.DB.prepare(
    "SELECT * FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NOT NULL",
  )
    .bind(noteId, principal.workspaceId)
    .first<NoteRow>();
  if (!existing) throw new AppError("not_found", "Trashed note not found.", 404);

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE notes SET deleted_at = NULL, updated_at = ? WHERE id = ?").bind(now, noteId),
    buildAuditStatement(env.DB, {
      workspaceId: principal.workspaceId,
      actorType: "human",
      actorId: principal.subjectId,
      action: "note.restore",
      resourceType: "note",
      resourceId: noteId,
    }),
  ]);

  const restored = await env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(noteId).first<NoteRow>();
  if (!restored) throw new AppError("internal_error", "Failed to read restored note.", 500);
  return jsonResponse(await formatNoteResponse(env.DB, restored));
};
