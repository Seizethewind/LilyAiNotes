import { normalizeTags } from "../classification/normalizeTags";
import { AppError, VALID_NOTE_TYPES } from "../types/env";
import { scanForSecrets } from "../validation/scanForSecrets";
import { validateUtf8Text } from "../validation/validateUtf8Text";

const VALID_SCOPES = new Set(["global", "project", "agent", "private"]);

export interface AgentIntakePayload {
  template_version?: unknown;
  sender?: unknown;
  title?: unknown;
  content?: unknown;
  type?: unknown;
  summary?: unknown;
  tags?: unknown;
  project?: unknown;
  scope?: unknown;
  status?: unknown;
  auto_classify?: unknown;
  validate_only?: unknown;
  supersedes_note_key?: unknown;
  related_note_keys?: unknown;
  change_note?: unknown;
}

export interface ValidatedAgentTemplate {
  templateVersion: "1.0";
  sender: string;
  title: string;
  content: string;
  type?: string;
  summary?: string;
  tags?: string[];
  project?: string;
  scope: string;
  autoClassify: boolean;
  validateOnly: boolean;
  supersedesNoteKey?: string;
  relatedNoteKeys: string[];
  changeNote: string;
}

export function validateAgentTemplate(raw: AgentIntakePayload): ValidatedAgentTemplate {
  if (raw.template_version !== "1.0") {
    throw new AppError("validation_error", "template_version must be '1.0'.", 422);
  }
  const sender = typeof raw.sender === "string" ? raw.sender.trim() : "";
  if (!sender || sender.length > 80) {
    throw new AppError("validation_error", "sender is required and must be 1 to 80 characters.", 422);
  }
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title || title.length > 200) {
    throw new AppError("validation_error", "title is required and must be 1 to 200 characters.", 422);
  }
  const content = typeof raw.content === "string" ? raw.content : "";
  if (!content.trim()) {
    throw new AppError("validation_error", "content is required.", 422);
  }
  validateUtf8Text(new TextEncoder().encode(content));

  if (typeof raw.status === "string" && raw.status.trim() && raw.status.trim() !== "unverified") {
    throw new AppError(
      "validation_error",
      "External AI submissions cannot set status other than 'unverified'.",
      422,
    );
  }

  let type: string | undefined;
  if (raw.type !== undefined && raw.type !== null && String(raw.type).trim() !== "") {
    const candidate = String(raw.type).trim().toLowerCase();
    if (!VALID_NOTE_TYPES.has(candidate)) {
      throw new AppError("validation_error", `Unsupported content type '${candidate}'.`, 422);
    }
    type = candidate;
  }

  let tags: string[] | undefined;
  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags) || raw.tags.some((t) => typeof t !== "string")) {
      throw new AppError("validation_error", "tags must be an array of strings.", 422);
    }
    tags = normalizeTags(raw.tags as string[]);
  }

  const scope = typeof raw.scope === "string" && raw.scope.trim() ? raw.scope.trim().toLowerCase() : "project";
  if (!VALID_SCOPES.has(scope)) {
    throw new AppError("validation_error", "scope must be global, project, agent, or private.", 422);
  }

  if (raw.related_note_keys !== undefined) {
    if (!Array.isArray(raw.related_note_keys) || raw.related_note_keys.some((k) => typeof k !== "string")) {
      throw new AppError("validation_error", "related_note_keys must be an array of note keys.", 422);
    }
  }
  const relatedNoteKeys = Array.isArray(raw.related_note_keys)
    ? (raw.related_note_keys as string[]).map((k) => k.trim()).filter(Boolean).slice(0, 10)
    : [];

  const summary = typeof raw.summary === "string" ? raw.summary.trim().slice(0, 180) : undefined;
  const project = typeof raw.project === "string" && raw.project.trim() ? raw.project.trim() : undefined;
  const supersedesNoteKey =
    typeof raw.supersedes_note_key === "string" && raw.supersedes_note_key.trim()
      ? raw.supersedes_note_key.trim()
      : undefined;
  const rawChange = typeof raw.change_note === "string" ? raw.change_note.trim() : "";
  const changeNote = rawChange ? `[Agent: ${sender}] ${rawChange}` : `Submitted via v1.0 template by ${sender}`;

  scanForSecrets(`${title}\n${summary || ""}\n${(tags || []).join(" ")}\n${content}`);

  return {
    templateVersion: "1.0",
    sender,
    title,
    content,
    type,
    summary: summary || undefined,
    tags,
    project,
    scope,
    autoClassify: Boolean(raw.auto_classify),
    validateOnly: Boolean(raw.validate_only),
    supersedesNoteKey,
    relatedNoteKeys,
    changeNote,
  };
}
