import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import { AppError } from "../../../../_lib/types/env";
import type { Env } from "../../../../_lib/types/env";

interface LinkSummary {
  id: string;
  title: string;
  status: string;
  version: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = await authenticateRequest(request, env);
  const noteId = String(params.id || "");
  const note = await env.DB.prepare(
    "SELECT id, parent_id, supersedes_id FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL",
  )
    .bind(noteId, principal.workspaceId)
    .first<{ id: string; parent_id: string | null; supersedes_id: string | null }>();
  if (!note) throw new AppError("not_found", "Note not found.", 404);

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
