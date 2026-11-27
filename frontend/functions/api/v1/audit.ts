import { authenticateRequest } from "../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../_lib/http/jsonResponse";
import type { Env } from "../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 50, 100));

  const rows = await env.DB.prepare(
    "SELECT id, workspace_id, actor_type, actor_id, action, resource_type, resource_id, details, created_at FROM audit_log WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?",
  )
    .bind(principal.workspaceId, limit)
    .all<{ details: string } & Record<string, unknown>>();

  return jsonResponse(
    rows.results.map((r) => ({
      ...r,
      details: typeof r.details === "string" ? JSON.parse(r.details) : r.details,
    })),
  );
};
