import { encryptBackup } from "../crypto/encryptBackup";
import { AppError } from "../types/env";

export async function exportBackupBundle(
  db: D1Database,
  backupsBucket: R2Bucket,
  encryptionKey: string,
  options: { since?: string; previousTotalCount?: number; dropThresholdPercent?: number } = {},
): Promise<string> {
  const countRow = await db.prepare("SELECT COUNT(*) AS cnt FROM notes").first<{ cnt: number }>();
  const totalNotes = Number(countRow?.cnt || 0);
  if (totalNotes === 0) {
    throw new AppError("backup_guard_empty_db", "Refusing backup upload from an empty database.", 409);
  }
  const threshold = options.dropThresholdPercent ?? 20;
  if (options.previousTotalCount && options.previousTotalCount > 0) {
    const dropPct = ((options.previousTotalCount - totalNotes) / options.previousTotalCount) * 100;
    if (dropPct > threshold) {
      throw new AppError("backup_guard_sharp_drop", `Refusing backup: note count dropped by ${dropPct.toFixed(1)}%.`, 409);
    }
  }

  const notesQuery = options.since
    ? db.prepare("SELECT * FROM notes WHERE updated_at >= ?").bind(options.since)
    : db.prepare("SELECT * FROM notes");
  const notesRes = await notesQuery.all();
  const versionsRes = await db.prepare("SELECT * FROM note_versions").all();

  const bundle = {
    kind: options.since ? "incremental" : "snapshot",
    exported_at: new Date().toISOString(),
    total_notes: totalNotes,
    notes: notesRes.results,
    note_versions: versionsRes.results,
  };
  const encrypted = await encryptBackup(new TextEncoder().encode(JSON.stringify(bundle)), encryptionKey);
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const objectKey = `${options.since ? "inc" : "full"}_${stamp}.lilybak`;
  await backupsBucket.put(objectKey, encrypted);
  return objectKey;
}
