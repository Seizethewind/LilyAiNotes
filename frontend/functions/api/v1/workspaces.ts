import { buildAuditStatement } from "../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../_lib/http/parseJsonBody";
import { AppError } from "../../_lib/types/env";
import type { Env } from "../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const rows = await env.DB.prepare(
    "SELECT w.id, w.name, w.slug, w.owner_id, w.created_at, m.role AS member_role FROM workspaces w JOIN workspace_members m ON w.id = m.workspace_id WHERE m.user_id = ? ORDER BY w.created_at ASC",
  )
    .bind(principal.subjectId)
    .all();
  return jsonResponse(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const body = await parseJsonBody<{ name?: string }>(request);
  const name = (body.name || "").trim();
  if (!name) throw new AppError("validation_error", "Workspace name is required.", 422);

  const id = crypto.randomUUID();
  const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  const slug = `${slugBase}-${id.slice(0, 6)}`;
  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(id, name, slug, principal.subjectId, now, now),
    env.DB.prepare(
      "INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)",
    ).bind(id, principal.subjectId, now),
    buildAuditStatement(env.DB, {
      workspaceId: id,
      actorType: "human",
      actorId: principal.subjectId,
      action: "workspace.create",
      resourceType: "workspace",
      resourceId: id,
      details: { name, slug },
    }),
  ]);

  return jsonResponse({ id, name, slug, owner_id: principal.subjectId, created_at: now }, 201);
};
