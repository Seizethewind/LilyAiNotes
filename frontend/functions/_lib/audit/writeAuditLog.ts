export function buildAuditStatement(
  db: D1Database,
  input: {
    workspaceId: string | null;
    actorType: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, unknown>;
  },
): D1PreparedStatement {
  return db
    .prepare(
      "INSERT INTO audit_log (id, workspace_id, actor_type, actor_id, action, resource_type, resource_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      input.workspaceId,
      input.actorType,
      input.actorId,
      input.action,
      input.resourceType,
      input.resourceId,
      JSON.stringify(input.details || {}),
      new Date().toISOString(),
    );
}
