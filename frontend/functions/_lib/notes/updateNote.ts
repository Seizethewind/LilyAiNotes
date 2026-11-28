import { buildAuditStatement } from "../audit/writeAuditLog";
import { normalizeTags } from "../classification/normalizeTags";
import { sha256Hex } from "../crypto/sha256Hex";
import { AppError, VALID_NOTE_TYPES } from "../types/env";
import type { AuthPrincipal } from "../types/env";
import { normalizeText } from "../validation/normalizeText";
import { scanForSecrets } from "../validation/scanForSecrets";
import { validateUtf8Text } from "../validation/validateUtf8Text";
import { buildChunkStatements } from "./buildChunkStatements";
import { buildTagStatements } from "./buildTagStatements";
import { formatNoteResponse } from "./getNoteResponse";
import type { NoteRow } from "./getNoteResponse";

export interface UpdateNoteInput {
  title?: string;
  summary?: string;
  content?: string;
  type?: string;
  tags?: string[];
  project?: string;
  scope?: string;
  change_note: string;
}

export async function updateNote(
  db: D1Database,
  principal: AuthPrincipal,
  noteId: string,
  input: UpdateNoteInput,
) {
  const existing = await db
    .prepare("SELECT * FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL")
    .bind(noteId, principal.workspaceId)
    .first<NoteRow>();
  if (!existing) throw new AppError("not_found", "Note not found.", 404);

  if (principal.allowedProject && existing.project !== principal.allowedProject) {
    throw new AppError("forbidden", `This API key is restricted to project '${principal.allowedProject}'.`, 403);
  }
  if (
    principal.kind === "api_key" &&
    ((existing.status !== "unverified" && existing.status !== "draft") || existing.created_by_key_id !== principal.subjectId)
  ) {
    throw new AppError("forbidden", "API keys can only edit unverified or draft notes created by the same key.", 403);
  }

  const changeNote = (input.change_note || "").trim();
  if (!changeNote) throw new AppError("validation_error", "change_note is required.", 422);

  const nextTitle = input.title !== undefined ? input.title.trim() : existing.title;
  const nextSummary = input.summary !== undefined ? input.summary.trim() : existing.summary;
  const nextContent = input.content !== undefined ? input.content : existing.content;
  const nextType = (input.type || existing.type).trim().toLowerCase();
  if (!VALID_NOTE_TYPES.has(nextType)) {
    throw new AppError("validation_error", `Unsupported content type '${nextType}'.`, 422);
  }
  const existingTags = JSON.parse(existing.tags_json || "[]") as string[];
  const nextTags = input.tags !== undefined ? normalizeTags(input.tags) : existingTags;
  const nextProject = input.project !== undefined ? input.project.trim() : existing.project;
  const nextScope = input.scope !== undefined ? input.scope : existing.scope;
  if (!nextTitle) throw new AppError("validation_error", "Title cannot be empty.", 422);

  validateUtf8Text(new TextEncoder().encode(nextContent));
  scanForSecrets(`${nextTitle}\n${nextSummary}\n${nextTags.join(" ")}\n${nextContent}`);
  const nextHash = await sha256Hex(normalizeText(nextContent));
  const nextVersion = existing.version + 1;
  const now = new Date().toISOString();
  const chunkSummary = [nextSummary, nextTags.length > 0 ? `Tags: ${nextTags.join(", ")}` : ""]
    .filter(Boolean)
    .join(" | ");

  await db.batch([
    db
      .prepare(
        "UPDATE notes SET title = ?, summary = ?, content = ?, content_hash = ?, type = ?, tags_json = ?, project = ?, scope = ?, version = ?, updated_at = ? WHERE id = ?",
      )
      .bind(
        nextTitle,
        nextSummary,
        nextContent,
        nextHash,
        nextType,
        JSON.stringify(nextTags),
        nextProject,
        nextScope,
        nextVersion,
        now,
        noteId,
      ),
    ...buildTagStatements(db, principal.workspaceId, noteId, nextTags),
    db
      .prepare(
        "INSERT INTO note_versions (id, note_id, version, content, change_note, edited_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), noteId, nextVersion, nextContent, changeNote, principal.displayName, now),
    ...buildChunkStatements(db, {
      id: noteId,
      title: nextTitle,
      summary: chunkSummary,
      content: nextContent,
      version: nextVersion,
    }),
    buildAuditStatement(db, {
      workspaceId: principal.workspaceId,
      actorType: principal.kind,
      actorId: principal.subjectId,
      action: "note.update",
      resourceType: "note",
      resourceId: noteId,
      details: { version: nextVersion, type: nextType, tags: nextTags, change_note: changeNote },
    }),
  ]);

  const updated = await db.prepare("SELECT * FROM notes WHERE id = ?").bind(noteId).first<NoteRow>();
  if (!updated) throw new AppError("internal_error", "Failed to read updated note.", 500);
  return formatNoteResponse(db, updated);
}
