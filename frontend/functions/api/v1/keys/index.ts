import { buildAuditStatement } from "../../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../_lib/auth/requireHumanSession";
import { generateApiKey } from "../../../_lib/crypto/generateApiKey";
import { sha256Hex } from "../../../_lib/crypto/sha256Hex";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../_lib/http/parseJsonBody";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const rows = await env.DB.prepare(
    "SELECT id, workspace_id, name, key_prefix, scope, allowed_project, created_at, last_used_at, revoked_at FROM api_keys WHERE workspace_id = ? ORDER BY created_at DESC",
  )
    .bind(principal.workspaceId)
    .all();
  return jsonResponse(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const body = await parseJsonBody<{ name?: string; scope?: string; allowed_project?: string | null }>(request);
  const name = (body.name || "").trim();
  if (!name) throw new AppError("validation_error", "Key name is required.", 422);
  const scope = body.scope === "read+write" ? "read+write" : "read";
  const allowedProject = (body.allowed_project || "").trim() || null;

  const { fullKey, prefix } = generateApiKey();
  const keyHash = await sha256Hex(fullKey);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO api_keys (id, workspace_id, user_id, name, key_prefix, key_hash, scope, allowed_project, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, principal.workspaceId, principal.subjectId, name, prefix, keyHash, scope, allowedProject, now),
    buildAuditStatement(env.DB, {
      workspaceId: principal.workspaceId,
      actorType: "human",
      actorId: principal.subjectId,
      action: "api_key.create",
      resourceType: "api_key",
      resourceId: id,
      details: { name, scope, allowed_project: allowedProject },
    }),
  ]);

  return jsonResponse(
    {
      id,
      workspace_id: principal.workspaceId,
      name,
      key_prefix: prefix,
      scope,
      allowed_project: allowedProject,
      created_at: now,
      last_used_at: null,
      revoked_at: null,
      plaintext_key: fullKey,
    },
    201,
  );
};
