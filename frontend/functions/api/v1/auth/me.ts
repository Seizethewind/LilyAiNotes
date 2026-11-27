import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const user = await env.DB.prepare(
    "SELECT id, email, display_name, role, created_at FROM users WHERE id = ?",
  )
    .bind(principal.subjectId)
    .first<{ id: string; email: string; display_name: string; role: string; created_at: string }>();

  if (!user) throw new AppError("unauthorized", "User not found.", 401);
  return jsonResponse({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    role: user.role,
    workspace_id: principal.workspaceId,
    created_at: user.created_at,
  });
};
