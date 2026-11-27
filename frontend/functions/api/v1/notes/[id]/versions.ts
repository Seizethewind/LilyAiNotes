import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { AppError } from "../../../../_lib/types/env";
import type { Env } from "../../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = await authenticateRequest(request, env);
  const noteId = String(params.id || "");
  const query =
    principal.kind === "human"
      ? "SELECT id FROM notes WHERE id = ? AND workspace_id = ?"
      : "SELECT id FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL";
  const note = await env.DB.prepare(query).bind(noteId, principal.workspaceId).first<{ id: string }>();
  if (!note) throw new AppError("not_found", "Note not found.", 404);

  const rows = await env.DB.prepare(
    "SELECT id, note_id, version, content, change_note, edited_by, created_at FROM note_versions WHERE note_id = ? ORDER BY version DESC",
  )
    .bind(noteId)
    .all();
  return jsonResponse(rows.results);
};
