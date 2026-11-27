import { AppError, TYPE_PREFIX_MAP } from "../types/env";

export async function allocateNoteKey(
  db: D1Database,
  workspaceId: string,
  noteType: string,
): Promise<string> {
  const prefix = TYPE_PREFIX_MAP[noteType] || "FACT";

  await db
    .prepare("INSERT OR IGNORE INTO note_counters (workspace_id, prefix, next_value) VALUES (?, ?, 1)")
    .bind(workspaceId, prefix)
    .run();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const row = await db
      .prepare("SELECT next_value FROM note_counters WHERE workspace_id = ? AND prefix = ?")
      .bind(workspaceId, prefix)
      .first<{ next_value: number }>();
    const seq = row?.next_value ?? 1;

    const updateRes = await db
      .prepare(
        "UPDATE note_counters SET next_value = next_value + 1 WHERE workspace_id = ? AND prefix = ? AND next_value = ?",
      )
      .bind(workspaceId, prefix, seq)
      .run();

    if ((updateRes.meta?.changes ?? 0) === 0) continue;

    const candidate = `${prefix}-${String(seq).padStart(3, "0")}`;
    const exists = await db
      .prepare("SELECT id FROM notes WHERE workspace_id = ? AND note_key = ?")
      .bind(workspaceId, candidate)
      .first<{ id: string }>();
    if (!exists) return candidate;
  }

  throw new AppError("key_allocation_failed", "Unable to allocate a unique note ID key.", 500);
}
