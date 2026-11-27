import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { formatNoteResponse } from "../../../_lib/notes/getNoteResponse";
import type { NoteRow } from "../../../_lib/notes/getNoteResponse";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = await authenticateRequest(request, env);
  const topicId = String(params.id || "");
  const topic = await env.DB.prepare(
    "SELECT * FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL",
  )
    .bind(topicId, principal.workspaceId)
    .first<NoteRow>();
  if (!topic) throw new AppError("not_found", "Topic note not found.", 404);

  const children = await env.DB.prepare(
    "SELECT id, title, summary, type, status, version, updated_at FROM notes WHERE parent_id = ? AND workspace_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC",
  )
    .bind(topicId, principal.workspaceId)
    .all();

  return jsonResponse({
    topic: await formatNoteResponse(env.DB, topic),
    children: children.results,
  });
};
