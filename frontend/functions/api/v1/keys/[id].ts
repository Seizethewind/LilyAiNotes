import { buildAuditStatement } from "../../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const keyId = String(params.id || "");
  const existing = await env.DB.prepare(
    "SELECT id, workspace_id, name, key_prefix, scope, created_at, last_used_at, revoked_at FROM api_keys WHERE id = ? AND workspace_id = ?",
  )
    .bind(keyId, principal.workspaceId)
    .first<Record<string, unknown>>();

  if (!existing) throw new AppError("not_found", "API key not found.", 404);
  const now = existing.revoked_at ? String(existing.revoked_at) : new Date().toISOString();

  if (!existing.revoked_at) {
    await env.DB.batch([
      env.DB.prepare("UPDATE api_keys SET revoked_at = ? WHERE id = ?").bind(now, keyId),
      buildAuditStatement(env.DB, {
        workspaceId: principal.workspaceId,
        actorType: "human",
        actorId: principal.subjectId,
        action: "api_key.revoke",
        resourceType: "api_key",
        resourceId: keyId,
      }),
    ]);
  }
  return jsonResponse({ ...existing, revoked_at: now });
};
