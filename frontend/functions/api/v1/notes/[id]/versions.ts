import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { findAccessibleNote } from "../../../../_lib/notes/findAccessibleNote";
import type { Env } from "../../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = await authenticateRequest(request, env);
  const note = await findAccessibleNote(env.DB, principal, String(params.id || ""), {
    includeDeletedForHumans: true,
  });

  const rows = await env.DB.prepare(
    "SELECT id, note_id, version, content, change_note, edited_by, created_at FROM note_versions WHERE note_id = ? ORDER BY version DESC",
  )
    .bind(note.id)
    .all();
  return jsonResponse(rows.results);
};
