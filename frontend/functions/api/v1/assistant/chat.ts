import { askGeminiWithNotes } from "../../../_lib/ai/askGeminiWithNotes";
import type { ChatTurn, GroundedNoteContext } from "../../../_lib/ai/askGeminiWithNotes";
import { selectNoteKeysFromHeaders } from "../../../_lib/ai/selectNoteKeysFromHeaders";
import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../_lib/http/parseJsonBody";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

interface ChatBody {
  message?: string;
  project?: string;
  type?: string;
  tag?: string;
  history?: ChatTurn[];
}

interface RawFetchedNote {
  id: string;
  note_key: string | null;
  type: string;
  title: string;
  project: string;
  status: string;
  version: number;
  tags_json: string;
  content: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const principal = await authenticateRequest(request, env);
  const body = await parseJsonBody<ChatBody>(request);
  const message = (body.message || "").trim();
  const project = (body.project || "").trim() || undefined;
  const noteType = (body.type || "").trim() || undefined;
  const tag = (body.tag || "").trim().toLowerCase() || undefined;
  if (!message) {
    throw new AppError("validation_error", "Message is required.", 422);
  }
  if (message.length > 4000) {
    throw new AppError("validation_error", "Message must be 4000 characters or fewer.", 422);
  }

  const stage1 = await selectNoteKeysFromHeaders(env, principal.workspaceId, {
    message,
    project,
    type: noteType,
    tag,
  });

  const headerByKey = new Map(stage1.headers.map((h) => [h.note_key, h]));
  const noteContexts: GroundedNoteContext[] = [];
  for (const key of stage1.selectedKeys) {
    const header = headerByKey.get(key);
    if (!header) continue;
    const row = await env.DB.prepare(
      "SELECT id, note_key, type, title, project, status, version, tags_json, content FROM notes WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL",
    )
      .bind(header.id, principal.workspaceId)
      .first<RawFetchedNote>();
    if (!row) continue;
    let tags: string[] = [];
    try {
      tags = JSON.parse(row.tags_json || "[]") as string[];
    } catch {
      tags = [];
    }
    noteContexts.push({
      id: row.id,
      note_key: row.note_key || header.note_key,
      type: row.type,
      title: row.title,
      project: row.project,
      status: row.status,
      version: row.version,
      tags,
      content: row.content,
    });
  }

  const reply = await askGeminiWithNotes(env, {
    message,
    notes: noteContexts,
    history: Array.isArray(body.history) ? body.history : [],
  });

  return jsonResponse({
    reply,
    model: "gemini-4-hydrogen",
    scannedHeaders: stage1.scannedCount,
    selectedKeys: stage1.selectedKeys,
    citations: noteContexts.map((n) => ({
      id: n.id,
      note_key: n.note_key,
      type: n.type,
      title: n.title,
      project: n.project,
      status: n.status,
      version: n.version,
      tags: n.tags,
    })),
  });
};
