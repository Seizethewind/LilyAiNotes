import type { NoteRow } from "./getNoteResponse";
import { AppError } from "../types/env";
import type { AuthPrincipal } from "../types/env";

export async function findAccessibleNote(
  db: D1Database,
  principal: AuthPrincipal,
  idOrKey: string,
  options?: { includeDeletedForHumans?: boolean },
): Promise<NoteRow> {
  const raw = idOrKey.trim();
  if (!raw) throw new AppError("not_found", "Note not found.", 404);

  const allowDeleted = Boolean(options?.includeDeletedForHumans && principal.kind === "human");
  const deletedClause = allowDeleted ? "" : " AND deleted_at IS NULL";
  const note = await db
    .prepare(
      `SELECT * FROM notes WHERE workspace_id = ? AND (id = ? OR UPPER(COALESCE(note_key, '')) = UPPER(?))${deletedClause} LIMIT 1`,
    )
    .bind(principal.workspaceId, raw, raw)
    .first<NoteRow>();

  if (!note) throw new AppError("not_found", "Note not found.", 404);
  if (principal.allowedProject && note.project !== principal.allowedProject) {
    throw new AppError(
      "forbidden",
      `This API key is restricted to project '${principal.allowedProject}'.`,
      403,
    );
  }
  return note;
}
