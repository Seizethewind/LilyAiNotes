import { sha256Hex } from "../crypto/sha256Hex";
import { verifySessionToken } from "../crypto/verifySessionToken";
import { AppError, SESSION_COOKIE_NAME } from "../types/env";
import type { AuthPrincipal, Env } from "../types/env";

export async function authenticateRequest(request: Request, env: Env): Promise<AuthPrincipal> {
  const authHeader = request.headers.get("Authorization") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  if (bearer.startsWith("LilyAiApikey") || bearer.startsWith("lily_k_")) {
    const keyHash = await sha256Hex(bearer);
    const keyRow = await env.DB.prepare(
      "SELECT id, workspace_id, name, scope, allowed_project FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL",
    )
      .bind(keyHash)
      .first<{ id: string; workspace_id: string; name: string; scope: string; allowed_project: string | null }>();
    if (!keyRow) {
      throw new AppError("unauthorized", "Invalid or revoked API key.", 401);
    }
    await env.DB.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), keyRow.id)
      .run();
    return {
      kind: "api_key",
      subjectId: keyRow.id,
      workspaceId: keyRow.workspace_id,
      displayName: keyRow.name,
      scope: keyRow.scope === "read+write" ? "read+write" : "read",
      role: "agent",
      allowedProject: keyRow.allowed_project?.trim() || null,
    };
  }

  let sessionToken = bearer;
  if (!sessionToken) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) sessionToken = decodeURIComponent(match[1]);
  }
  if (!sessionToken) {
    throw new AppError("unauthorized", "Authentication required.", 401);
  }
  const secret = env.APP_SECRET_KEY || "dev-fallback-secret-change-me";
  const claims = await verifySessionToken(sessionToken, secret);
  if (!claims) {
    throw new AppError("unauthorized", "Invalid or expired session.", 401);
  }
  const user = await env.DB.prepare(
    "SELECT id, display_name, role FROM users WHERE id = ? AND is_active = 1",
  )
    .bind(claims.sub)
    .first<{ id: string; display_name: string; role: string }>();
  if (!user) {
    throw new AppError("unauthorized", "User account is unavailable.", 401);
  }
  return {
    kind: "human",
    subjectId: user.id,
    workspaceId: claims.ws,
    displayName: user.display_name,
    scope: "human",
    role: user.role,
    allowedProject: null,
  };
}
