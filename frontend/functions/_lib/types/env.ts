export interface Env {
  DB: D1Database;
  STORAGE?: R2Bucket;
  BACKUPS?: R2Bucket;
  APP_ENV?: string;
  APP_SECRET_KEY?: string;
  COOKIE_SECURE?: string;
  BACKUP_ENCRYPTION_KEY?: string;
  BACKUP_DROP_THRESHOLD_PERCENT?: string;
  GEMINI_API_KEY?: string;
}

export interface AuthPrincipal {
  kind: "human" | "api_key";
  subjectId: string;
  workspaceId: string;
  displayName: string;
  scope: "human" | "read" | "read+write";
  role: string;
  allowedProject: string | null;
}

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const SESSION_COOKIE_NAME = "lily_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const MAX_NOTE_BYTES = 100 * 1024;
export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_SEARCH_LIMIT = 50;
export const DEFAULT_SEARCH_LIMIT = 10;

export const TYPE_PREFIX_MAP: Record<string, string> = {
  fact: "FACT",
  decision: "DEC",
  procedure: "PROC",
  preference: "PREF",
  code: "CODE",
  log: "LOG",
  config: "CFG",
};

export const VALID_NOTE_TYPES = new Set(Object.keys(TYPE_PREFIX_MAP));
export const VALID_NOTE_STATUSES = new Set(["unverified", "draft", "verified", "disputed", "superseded"]);
