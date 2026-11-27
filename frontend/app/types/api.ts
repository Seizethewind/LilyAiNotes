export type NoteType = "fact" | "decision" | "procedure" | "preference" | "code" | "log" | "config";
export type NoteScope = "global" | "project" | "agent" | "private";
export type NoteStatus = "draft" | "verified" | "disputed" | "superseded";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  workspace_id: string;
  created_at: string;
}

export interface AuthSessionResponse {
  user: UserProfile;
  session_token: string;
}

export interface NoteRecord {
  id: string;
  note_key: string;
  workspace_id: string;
  title: string;
  summary: string;
  type: NoteType;
  tags: string[];
  project: string;
  scope: NoteScope;
  source: string;
  author: string;
  status: NoteStatus;
  processing_status: string;
  content: string;
  version: number;
  change_note: string;
  parent_id: string | null;
  supersedes_id: string | null;
  related_ids: string[];
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  valid_until: string | null;
  deleted_at: string | null;
}

export interface NoteSearchItem {
  id: string;
  note_key: string;
  title: string;
  summary: string;
  snippet: string;
  type: NoteType;
  tags: string[];
  project: string;
  scope: NoteScope;
  status: NoteStatus;
  breadcrumb: string;
  version: number;
  updated_at: string;
}

export interface ClassificationSuggestion {
  type: NoteType;
  tags: string[];
  summary: string;
  reason: string;
  source: "rules" | "gemini";
}

export interface TagFacet {
  tag: string;
  count: number;
}

export interface NoteVersionRecord {
  id: string;
  note_id: string;
  version: number;
  content: string;
  change_note: string;
  edited_by: string;
  created_at: string;
}

export interface NoteLinkSummary {
  id: string;
  title: string;
  status: NoteStatus;
  version: number;
}

export interface NoteLinksResponse {
  id: string;
  parent_id: string | null;
  supersedes_id: string | null;
  related_ids: string[];
  parent: NoteLinkSummary | null;
  supersedes: NoteLinkSummary | null;
  superseded_by: NoteLinkSummary[];
  children: NoteLinkSummary[];
}

export interface AssistantCitation {
  id: string;
  note_key: string;
  type: NoteType;
  title: string;
  project: string;
  status: NoteStatus;
  version: number;
  tags: string[];
}

export interface AssistantChatResponse {
  reply: string;
  model: string;
  scannedHeaders?: number;
  selectedKeys?: string[];
  citations: AssistantCitation[];
}

export interface ApiKeyRecord {
  id: string;
  workspace_id: string;
  name: string;
  key_prefix: string;
  scope: "read" | "read+write";
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  plaintext_key?: string;
}

export interface AuditLogRecord {
  id: string;
  workspace_id: string | null;
  actor_type: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  database: string;
}
