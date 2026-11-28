import { createSessionToken } from "../../../_lib/crypto/createSessionToken";
import { verifyPassword } from "../../../_lib/crypto/verifyPassword";
import { getSessionSecret } from "../../../_lib/auth/getSessionSecret";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../_lib/http/parseJsonBody";
import { buildSessionCookieHeader } from "../../../_lib/http/setSessionCookie";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

interface LoginBody {
  email?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = getSessionSecret(env); // check before any database write
  const body = await parseJsonBody<LoginBody>(request);
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  const user = await env.DB.prepare(
    "SELECT id, email, display_name, password_hash, role, created_at FROM users WHERE email = ? AND is_active = 1",
  )
    .bind(email)
    .first<{
      id: string;
      email: string;
      display_name: string;
      password_hash: string;
      role: string;
      created_at: string;
    }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AppError("invalid_credentials", "Invalid email or password.", 401);
  }

  const membership = await env.DB.prepare(
    "SELECT workspace_id FROM workspace_members WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
  )
    .bind(user.id)
    .first<{ workspace_id: string }>();

  let workspaceId = membership?.workspace_id;
  if (!workspaceId) {
    workspaceId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at) VALUES (?, 'Primary', ?, ?, ?, ?)",
      ).bind(workspaceId, `primary-${user.id.slice(0, 6)}`, user.id, now, now),
      env.DB.prepare(
        "INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)",
      ).bind(workspaceId, user.id, now),
    ]);
  }

  const token = await createSessionToken(user.id, workspaceId, secret);
  const secure = env.COOKIE_SECURE === "true" && new URL(request.url).protocol === "https:";

  return jsonResponse(
    {
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        workspace_id: workspaceId,
        created_at: user.created_at,
      },
      session_token: token,
    },
    200,
    { "Set-Cookie": buildSessionCookieHeader(token, secure) },
  );
};
