import { buildAuditStatement } from "../../../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../../_lib/http/parseJsonBody";
import { findAccessibleNote } from "../../../../_lib/notes/findAccessibleNote";
import { formatNoteResponse } from "../../../../_lib/notes/getNoteResponse";
import type { NoteRow } from "../../../../_lib/notes/getNoteResponse";
import { AppError, VALID_NOTE_STATUSES } from "../../../../_lib/types/env";
import type { Env } from "../../../../_lib/types/env";

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const body = await parseJsonBody<{ status?: string }>(request);
  const nextStatus = (body.status || "").trim();
  if (!VALID_NOTE_STATUSES.has(nextStatus)) {
    throw new AppError("validation_error", "Status must be verified, disputed, unverified, draft, or superseded.", 422);
  }

  const existing = await findAccessibleNote(env.DB, principal, String(params.id || ""));
  const noteId = existing.id;

  const now = new Date().toISOString();
  const verifiedAt =
    nextStatus === "verified" ? now : nextStatus === "draft" || nextStatus === "unverified" ? null : existing.verified_at;
  await env.DB.batch([
    env.DB.prepare("UPDATE notes SET status = ?, verified_at = ?, updated_at = ? WHERE id = ?").bind(
      nextStatus,
      verifiedAt,
      now,
      noteId,
    ),
    buildAuditStatement(env.DB, {
      workspaceId: principal.workspaceId,
      actorType: "human",
      actorId: principal.subjectId,
      action: "note.verify",
      resourceType: "note",
      resourceId: noteId,
      details: { previous_status: existing.status, next_status: nextStatus },
    }),
  ]);

  const updated = await env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(noteId).first<NoteRow>();
  if (!updated) throw new AppError("internal_error", "Failed to read verified note.", 500);
  return jsonResponse(await formatNoteResponse(env.DB, updated));
};
