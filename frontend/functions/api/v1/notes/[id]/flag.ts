import { buildAuditStatement } from "../../../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../../_lib/http/parseJsonBody";
import { formatNoteResponse } from "../../../../_lib/notes/getNoteResponse";
import type { NoteRow } from "../../../../_lib/notes/getNoteResponse";
import { AppError } from "../../../../_lib/types/env";
import type { Env } from "../../../../_lib/types/env";

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = await authenticateRequest(request, env);
  const noteId = String(params.id || "");
  const body = await parseJsonBody<{ reason?: string; proposed_action?: string }>(request).catch(
    () => ({ reason: undefined, proposed_action: undefined }),
  );

  const existing = await env.DB.prepare(
    "SELECT * FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL",
  )
    .bind(noteId, principal.workspaceId)
    .first<NoteRow>();
  if (!existing) throw new AppError("not_found", "Note not found.", 404);

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE notes SET status = 'disputed', updated_at = ? WHERE id = ?").bind(now, noteId),
    buildAuditStatement(env.DB, {
      workspaceId: principal.workspaceId,
      actorType: principal.kind,
      actorId: principal.subjectId,
      action: "note.flag",
      resourceType: "note",
      resourceId: noteId,
      details: {
        reason: (body.reason || "").trim(),
        proposed_action: (body.proposed_action || "dispute").trim(),
      },
    }),
  ]);

  const updated = await env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(noteId).first<NoteRow>();
  if (!updated) throw new AppError("internal_error", "Failed to read flagged note.", 500);
  return jsonResponse(await formatNoteResponse(env.DB, updated));
};
