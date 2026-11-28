// @vitest-environment node
import { describe, expect, it } from "vitest";

import { exportBackupBundle } from "../../functions/_lib/backup/exportBackupBundle";
import { restoreFromR2IfEmpty } from "../../functions/_lib/backup/restoreFromR2IfEmpty";
import { createNote } from "../../functions/_lib/notes/createNote";
import type { AuthPrincipal } from "../../functions/_lib/types/env";
import { createMockD1 } from "../helpers/mockD1";
import { createMockR2 } from "../helpers/mockR2";

async function seedUserAndWorkspace(db: D1Database): Promise<AuthPrincipal> {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT INTO users (id, email, display_name, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 'owner', 1, ?, ?)")
      .bind("u1", "owner@example.com", "Owner", "hash", now, now),
    db.prepare("INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind("w1", "Primary", "primary", "u1", now, now),
  ]);
  return { kind: "human", subjectId: "u1", workspaceId: "w1", displayName: "Owner", scope: "human", role: "owner", allowedProject: null };
}

describe("encrypted D1 backup and restore guards", () => {
  it("refuses export from empty database and sharp drop > 20%", async () => {
    const db = createMockD1();
    const backups = createMockR2();
    const principal = await seedUserAndWorkspace(db);

    await expect(exportBackupBundle(db, backups, "strong-backup-secret")).rejects.toMatchObject({
      code: "backup_guard_empty_db",
    });

    await createNote(db, principal, { title: "One", content: "First note body" });
    await expect(
      exportBackupBundle(db, backups, "strong-backup-secret", { previousTotalCount: 10, dropThresholdPercent: 20 }),
    ).rejects.toMatchObject({ code: "backup_guard_sharp_drop" });
  });

  it("refuses restore on non-empty DB and preserves deleted_at on wipe-and-recover", async () => {
    const db = createMockD1();
    const backups = createMockR2();
    const principal = await seedUserAndWorkspace(db);

    const active = await createNote(db, principal, { title: "Active", content: "Active note content" });
    const trashed = await createNote(db, principal, { title: "Trashed", content: "Trashed note content" });
    await db.prepare("UPDATE notes SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), trashed.id).run();

    const snapKey = await exportBackupBundle(db, backups, "strong-backup-secret");
    expect(snapKey).toMatch(/^full_.*\.lilybak$/);
    expect(await restoreFromR2IfEmpty(db, backups, "strong-backup-secret")).toBe(0);

    const freshDb = createMockD1();
    await seedUserAndWorkspace(freshDb);
    const restoredCount = await restoreFromR2IfEmpty(freshDb, backups, "strong-backup-secret");
    expect(restoredCount).toBe(2);

    const restoredActive = await freshDb.prepare("SELECT deleted_at FROM notes WHERE id = ?").bind(active.id).first<{ deleted_at: string | null }>();
    const restoredTrashed = await freshDb.prepare("SELECT deleted_at FROM notes WHERE id = ?").bind(trashed.id).first<{ deleted_at: string | null }>();
    expect(restoredActive?.deleted_at).toBeNull();
    expect(restoredTrashed?.deleted_at).not.toBeNull();
  });
});
