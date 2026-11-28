import { buildAuditStatement } from "../../../_lib/audit/writeAuditLog";
import { createSessionToken } from "../../../_lib/crypto/createSessionToken";
import { hashPassword } from "../../../_lib/crypto/hashPassword";
import { getSessionSecret } from "../../../_lib/auth/getSessionSecret";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../_lib/http/parseJsonBody";
import { buildSessionCookieHeader } from "../../../_lib/http/setSessionCookie";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

interface RegisterBody {
  email?: string;
  display_name?: string;
  password?: string;
  workspace_name?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = getSessionSecret(env); // check before any database write
  const body = await parseJsonBody<RegisterBody>(request);
  const email = (body.email || "").trim().toLowerCase();
  const displayName = (body.display_name || "").trim();
  const password = body.password || "";
  const workspaceName = (body.workspace_name || "Primary Workspace").trim() || "Primary Workspace";

  if (!email.includes("@") || !displayName || password.length < 8) {
    throw new AppError("validation_error", "Valid email, display_name, and password (8+ chars) are required.", 422);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    throw new AppError("email_taken", "An account with this email already exists.", 409);
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const slugBase = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  const slug = `${slugBase}-${userId.slice(0, 6)}`;
  const passwordHash = await hashPassword(password);

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO users (id, email, display_name, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 'owner', 1, ?, ?)",
    ).bind(userId, email, displayName, passwordHash, now, now),
    env.DB.prepare(
      "INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(workspaceId, workspaceName, slug, userId, now, now),
    env.DB.prepare(
      "INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)",
    ).bind(workspaceId, userId, now),
    buildAuditStatement(env.DB, {
      workspaceId,
      actorType: "human",
      actorId: userId,
      action: "user.register",
      resourceType: "user",
      resourceId: userId,
    }),
  ]);

  const token = await createSessionToken(userId, workspaceId, secret);
  const secure = env.COOKIE_SECURE === "true" && new URL(request.url).protocol === "https:";

  return jsonResponse(
    {
      user: {
        id: userId,
        email,
        display_name: displayName,
        role: "owner",
        workspace_id: workspaceId,
        created_at: now,
      },
      session_token: token,
    },
    201,
    { "Set-Cookie": buildSessionCookieHeader(token, secure) },
  );
};
