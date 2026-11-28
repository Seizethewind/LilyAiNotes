import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { findAccessibleNote } from "../../../../_lib/notes/findAccessibleNote";
import type { Env } from "../../../../_lib/types/env";

interface LinkSummary {
  id: string;
  title: string;
  status: string;
  version: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = await authenticateRequest(request, env);
  const note = await findAccessibleNote(env.DB, principal, String(params.id || ""));
  const noteId = note.id;

  const links = await env.DB.prepare("SELECT to_id, kind FROM note_links WHERE from_id = ?")
    .bind(noteId)
    .all<{ to_id: string; kind: string }>();
  const relatedIds = links.results.filter((l) => l.kind === "related").map((l) => l.to_id);

  const parent = note.parent_id
    ? await env.DB.prepare(
        "SELECT id, title, status, version FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL",
      )
        .bind(note.parent_id, principal.workspaceId)
        .first<LinkSummary>()
    : null;

  const supersedes = note.supersedes_id
    ? await env.DB.prepare(
        "SELECT id, title, status, version FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL",
      )
        .bind(note.supersedes_id, principal.workspaceId)
        .first<LinkSummary>()
    : null;

  const supersededBy = await env.DB.prepare(
    "SELECT id, title, status, version FROM notes WHERE supersedes_id = ? AND workspace_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
  )
    .bind(noteId, principal.workspaceId)
    .all<LinkSummary>();

  const children = await env.DB.prepare(
    "SELECT id, title, status, version FROM notes WHERE parent_id = ? AND workspace_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC",
  )
    .bind(noteId, principal.workspaceId)
    .all<LinkSummary>();

  return jsonResponse({
    id: note.id,
    parent_id: note.parent_id,
    supersedes_id: note.supersedes_id,
    related_ids: relatedIds,
    parent: parent || null,
    supersedes: supersedes || null,
    superseded_by: supersededBy.results,
    children: children.results,
  });
};
