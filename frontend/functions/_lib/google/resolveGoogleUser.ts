import { buildAuditStatement } from "../audit/writeAuditLog";
import { AppError } from "../types/env";
import type { AuthPrincipal } from "../types/env";
import type { GoogleProfile } from "./exchangeGoogleCode";

const INSERT_IDENTITY =
  "INSERT INTO user_identities (provider, subject, user_id, created_at) VALUES ('google', ?, ?, ?)";

function findIdentity(db: D1Database, subject: string) {
  return db
    .prepare("SELECT user_id FROM user_identities WHERE provider = 'google' AND subject = ?")
    .bind(subject)
    .first<{ user_id: string }>();
}

/** Signs in a linked user, or creates a new account. Never links by matching email. */
export async function signInWithGoogle(
  db: D1Database,
  profile: GoogleProfile,
): Promise<{ userId: string; workspaceId: string }> {
  const identity = await findIdentity(db, profile.subject);
  if (identity) {
    const row = await db
      .prepare(
        "SELECT m.workspace_id FROM users u JOIN workspace_members m ON m.user_id = u.id WHERE u.id = ? AND u.is_active = 1 ORDER BY m.created_at ASC LIMIT 1",
      )
      .bind(identity.user_id)
      .first<{ workspace_id: string }>();
    if (!row) throw new AppError("account_unavailable", "User account is unavailable.", 401);
    return { userId: identity.user_id, workspaceId: row.workspace_id };
  }

  // Password registration does not verify email ownership, so auto-linking would allow account takeover.
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(profile.email).first();
  if (existing) {
    throw new AppError("google_account_exists", "Sign in with your password, then connect Google.", 409);
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  await db.batch([
    db
      .prepare(
        // "google-only" is not a valid password hash, so password login always fails for this user.
        "INSERT INTO users (id, email, display_name, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, 'google-only', 'owner', 1, ?, ?)",
      )
      .bind(userId, profile.email, profile.name, now, now),
    db
      .prepare(
        "INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at) VALUES (?, 'Primary Workspace', ?, ?, ?, ?)",
      )
      .bind(workspaceId, `primary-${workspaceId}`, userId, now, now),
    db
      .prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)")
      .bind(workspaceId, userId, now),
    db.prepare(INSERT_IDENTITY).bind(profile.subject, userId, now),
    buildAuditStatement(db, {
      workspaceId,
      actorType: "human",
      actorId: userId,
      action: "user.register_google",
      resourceType: "user",
      resourceId: userId,
    }),
  ]);
  return { userId, workspaceId };
}

/** Connects a Google account to the user who is already signed in. */
export async function linkGoogleAccount(
  db: D1Database,
  principal: AuthPrincipal,
  profile: GoogleProfile,
): Promise<void> {
  const identity = await findIdentity(db, profile.subject);
  if (identity?.user_id === principal.subjectId) return;
  if (identity) {
    throw new AppError("google_in_use", "That Google account is connected to another user.", 409);
  }
  const current = await db
    .prepare("SELECT subject FROM user_identities WHERE provider = 'google' AND user_id = ?")
    .bind(principal.subjectId)
    .first();
  if (current) {
    throw new AppError("google_already_linked", "A different Google account is already connected.", 409);
  }
  await db.batch([
    db.prepare(INSERT_IDENTITY).bind(profile.subject, principal.subjectId, new Date().toISOString()),
    buildAuditStatement(db, {
      workspaceId: principal.workspaceId,
      actorType: "human",
      actorId: principal.subjectId,
      action: "user.link_google",
      resourceType: "user",
      resourceId: principal.subjectId,
    }),
  ]);
}
