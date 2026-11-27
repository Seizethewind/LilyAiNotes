import { decryptBackup } from "../crypto/decryptBackup";
import { buildChunkStatements } from "../notes/buildChunkStatements";

interface BackupBundle {
  notes: Array<Record<string, unknown>>;
  note_versions: Array<Record<string, unknown>>;
}

export async function restoreFromR2IfEmpty(
  db: D1Database,
  backupsBucket: R2Bucket,
  encryptionKey: string,
): Promise<number> {
  const countRow = await db.prepare("SELECT COUNT(*) AS cnt FROM notes").first<{ cnt: number }>();
  if (Number(countRow?.cnt || 0) > 0) return 0;

  const listed = await backupsBucket.list();
  const keys = listed.objects.map((o) => o.key).sort();
  const snapshots = keys.filter((k) => k.startsWith("full_"));
  if (snapshots.length === 0) return 0;

  const latestSnap = snapshots[snapshots.length - 1];
  const incAnchor = latestSnap.replace("full_", "inc_");
  const replayKeys = [latestSnap, ...keys.filter((k) => k.startsWith("inc_") && k >= incAnchor)];
  const restoredIds = new Set<string>();

  for (const key of replayKeys) {
    const obj = await backupsBucket.get(key);
    if (!obj) continue;
    const raw = new Uint8Array(await obj.arrayBuffer());
    const bundle = JSON.parse(new TextDecoder().decode(await decryptBackup(raw, encryptionKey))) as BackupBundle;
    const stmts: D1PreparedStatement[] = [];

    for (const n of bundle.notes) {
      const id = String(n.id);
      stmts.push(
        db
          .prepare(
            "INSERT OR REPLACE INTO notes (id, workspace_id, title, summary, type, project, scope, source, author, status, processing_status, content, content_hash, storage_key, version, parent_id, supersedes_id, created_at, updated_at, verified_at, valid_until, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            id, n.workspace_id, n.title, n.summary || "", n.type, n.project, n.scope, n.source,
            n.author, n.status, n.content, n.content_hash, n.storage_key || null, Number(n.version),
            n.parent_id || null, n.supersedes_id || null, n.created_at, n.updated_at,
            n.verified_at || null, n.valid_until || null, n.deleted_at || null,
          ),
      );
      stmts.push(
        ...buildChunkStatements(db, {
          id,
          title: String(n.title),
          summary: String(n.summary || ""),
          content: String(n.content),
          version: Number(n.version),
        }),
      );
      restoredIds.add(id);
    }
    for (const v of bundle.note_versions) {
      stmts.push(
        db
          .prepare(
            "INSERT OR IGNORE INTO note_versions (id, note_id, version, content, change_note, edited_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(v.id, v.note_id, Number(v.version), v.content, v.change_note, v.edited_by, v.created_at),
      );
    }
    if (stmts.length > 0) await db.batch(stmts);
  }
  return restoredIds.size;
}
