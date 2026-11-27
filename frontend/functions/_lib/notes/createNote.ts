import { buildAuditStatement } from "../audit/writeAuditLog";
import { normalizeTags } from "../classification/normalizeTags";
import { sha256Hex } from "../crypto/sha256Hex";
import { AppError, VALID_NOTE_TYPES } from "../types/env";
import type { AuthPrincipal } from "../types/env";
import { normalizeText } from "../validation/normalizeText";
import { scanForSecrets } from "../validation/scanForSecrets";
import { validateUtf8Text } from "../validation/validateUtf8Text";
import { allocateNoteKey } from "./allocateNoteKey";
import { buildChunkStatements } from "./buildChunkStatements";
import { buildTagStatements } from "./buildTagStatements";
import { formatNoteResponse } from "./getNoteResponse";
import type { NoteRow } from "./getNoteResponse";

export interface CreateNoteInput {
  title: string;
  summary?: string;
  content: string;
  type?: string;
  tags?: string[];
  project?: string;
  scope?: string;
  status?: string;
  parent_id?: string | null;
  supersedes_id?: string | null;
  related_ids?: string[];
  change_note?: string;
  storage_key?: string | null;
}

export async function createNote(db: D1Database, principal: AuthPrincipal, input: CreateNoteInput) {
  const title = (input.title || "").trim();
  const summary = (input.summary || "").trim();
  const project = (input.project || "general").trim() || "general";
  const noteType = (input.type || "fact").trim().toLowerCase();
  if (!VALID_NOTE_TYPES.has(noteType)) {
    throw new AppError("validation_error", `Unsupported content type '${noteType}'.`, 422);
  }
  const tags = normalizeTags(input.tags || []);
  const scope = input.scope || "project";
  if (!title) throw new AppError("validation_error", "Title is required.", 422);

  validateUtf8Text(new TextEncoder().encode(input.content || ""));
  scanForSecrets(`${title}\n${summary}\n${tags.join(" ")}\n${input.content}`);
  const contentHash = await sha256Hex(normalizeText(input.content));

  const dup = await db
    .prepare(
      "SELECT id FROM notes WHERE workspace_id = ? AND project = ? AND content_hash = ? AND deleted_at IS NULL",
    )
    .bind(principal.workspaceId, project, contentHash)
    .first<{ id: string }>();
  if (dup) {
    throw new AppError("duplicate_note", "An active note with identical content already exists in this project.", 409);
  }

  const effectiveStatus = principal.kind === "api_key" ? "draft" : input.status || "draft";
  const now = new Date().toISOString();
  const noteId = crypto.randomUUID();
  const noteKey = await allocateNoteKey(db, principal.workspaceId, noteType);
  const changeNote = (input.change_note || "Initial creation").trim();
  const chunkSummary = [summary, tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""].filter(Boolean).join(" | ");

  const stmts: D1PreparedStatement[] = [
    db
      .prepare(
        "INSERT INTO notes (id, workspace_id, note_key, title, summary, type, tags_json, project, scope, source, author, status, processing_status, content, content_hash, storage_key, version, parent_id, supersedes_id, created_by_user_id, created_by_key_id, created_at, updated_at, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        noteId,
        principal.workspaceId,
        noteKey,
        title,
        summary,
        noteType,
        JSON.stringify(tags),
        project,
        scope,
        principal.kind === "api_key" ? "agent" : "human",
        principal.displayName,
        effectiveStatus,
        input.content,
        contentHash,
        input.storage_key || null,
        input.parent_id || null,
        input.supersedes_id || null,
        principal.kind === "human" ? principal.subjectId : null,
        principal.kind === "api_key" ? principal.subjectId : null,
        now,
        now,
        effectiveStatus === "verified" ? now : null,
      ),
    ...buildTagStatements(db, principal.workspaceId, noteId, tags),
    db
      .prepare(
        "INSERT INTO note_versions (id, note_id, version, content, change_note, edited_by, created_at) VALUES (?, ?, 1, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), noteId, input.content, changeNote, principal.displayName, now),
    ...buildChunkStatements(db, { id: noteId, title, summary: chunkSummary, content: input.content, version: 1 }),
    buildAuditStatement(db, {
      workspaceId: principal.workspaceId,
      actorType: principal.kind,
      actorId: principal.subjectId,
      action: "note.create",
      resourceType: "note",
      resourceId: noteId,
      details: { note_key: noteKey, type: noteType, tags, project, status: effectiveStatus, version: 1 },
    }),
  ];

  if (input.supersedes_id) {
    stmts.push(
      db
        .prepare("UPDATE notes SET status = 'superseded', updated_at = ? WHERE id = ? AND workspace_id = ?")
        .bind(now, input.supersedes_id, principal.workspaceId),
    );
    stmts.push(
      db
        .prepare("INSERT INTO note_links (id, from_id, to_id, kind, created_at) VALUES (?, ?, ?, 'replaces', ?)")
        .bind(crypto.randomUUID(), noteId, input.supersedes_id, now),
    );
  }
  for (const relId of input.related_ids || []) {
    stmts.push(
      db
        .prepare("INSERT INTO note_links (id, from_id, to_id, kind, created_at) VALUES (?, ?, ?, 'related', ?)")
        .bind(crypto.randomUUID(), noteId, relId, now),
    );
  }

  await db.batch(stmts);
  const created = await db.prepare("SELECT * FROM notes WHERE id = ?").bind(noteId).first<NoteRow>();
  if (!created) throw new AppError("internal_error", "Failed to read created note.", 500);
  return formatNoteResponse(db, created);
}
