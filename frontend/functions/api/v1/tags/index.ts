import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import type { Env } from "../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = await authenticateRequest(request, env);
  const rows = await env.DB.prepare(
    `SELECT nt.tag, COUNT(*) AS count
     FROM note_tags nt
     INNER JOIN notes n ON n.id = nt.note_id
     WHERE nt.workspace_id = ? AND n.deleted_at IS NULL
     GROUP BY nt.tag
     ORDER BY count DESC, nt.tag ASC
     LIMIT 100`,
  )
    .bind(principal.workspaceId)
    .all<{ tag: string; count: number }>();

  return jsonResponse(rows.results);
};
