import { buildAuditStatement } from "../../../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../../_lib/auth/requireHumanSession";
import { requireWriteScope } from "../../../../_lib/auth/requireWriteScope";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../../_lib/http/parseJsonBody";
import { findAccessibleNote } from "../../../../_lib/notes/findAccessibleNote";
import { formatNoteResponse } from "../../../../_lib/notes/getNoteResponse";
import { updateNote } from "../../../../_lib/notes/updateNote";
import type { UpdateNoteInput } from "../../../../_lib/notes/updateNote";
import { AppError } from "../../../../_lib/types/env";
import type { Env } from "../../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = await authenticateRequest(request, env);
  const note = await findAccessibleNote(env.DB, principal, String(params.id || ""), {
    includeDeletedForHumans: true,
  });
  return jsonResponse(await formatNoteResponse(env.DB, note));
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = requireWriteScope(await authenticateRequest(request, env));
  const note = await findAccessibleNote(env.DB, principal, String(params.id || ""));
  const body = await parseJsonBody<UpdateNoteInput>(request);
  const updated = await updateNote(env.DB, principal, note.id, body);
  return jsonResponse(updated);
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const noteId = String(params.id || "");
  const existing = await env.DB.prepare(
    "SELECT id FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL",
  )
    .bind(noteId, principal.workspaceId)
    .first<{ id: string }>();
  if (!existing) throw new AppError("not_found", "Note not found.", 404);

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ?").bind(now, now, noteId),
    buildAuditStatement(env.DB, {
      workspaceId: principal.workspaceId,
      actorType: "human",
      actorId: principal.subjectId,
      action: "note.soft_delete",
      resourceType: "note",
      resourceId: noteId,
    }),
  ]);
  return jsonResponse({ status: "trashed", id: noteId });
};
