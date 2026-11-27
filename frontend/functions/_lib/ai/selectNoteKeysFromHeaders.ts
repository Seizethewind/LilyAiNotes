import { GoogleGenAI, Type } from "@google/genai";

import { AppError } from "../types/env";
import type { Env } from "../types/env";

export interface NoteHeaderRecord {
  id: string;
  note_key: string;
  type: string;
  project: string;
  scope: string;
  status: string;
  title: string;
  summary: string;
  tags: string[];
  version: number;
}

interface RawHeaderRow {
  id: string;
  note_key: string | null;
  type: string;
  project: string;
  scope: string;
  status: string;
  title: string;
  summary: string;
  tags_json: string;
  version: number;
}

export async function selectNoteKeysFromHeaders(
  env: Env,
  workspaceId: string,
  input: { message: string; project?: string; type?: string; tag?: string },
): Promise<{ selectedKeys: string[]; scannedCount: number; headers: NoteHeaderRecord[] }> {
  const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    throw new AppError(
      "ai_provider_unconfigured",
      "GEMINI_API_KEY is not configured on the server. Add it to Cloudflare Pages Secrets or .dev.vars.",
      503,
    );
  }

  const clauses = ["workspace_id = ?", "deleted_at IS NULL"];
  const binds: unknown[] = [workspaceId];
  if (input.project) {
    clauses.push("project = ?");
    binds.push(input.project);
  }
  if (input.type) {
    clauses.push("type = ?");
    binds.push(input.type);
  }
  if (input.tag) {
    clauses.push("id IN (SELECT note_id FROM note_tags WHERE workspace_id = ? AND tag = ?)");
    binds.push(workspaceId, input.tag.toLowerCase());
  }

  const rows = await env.DB.prepare(
    `SELECT id, note_key, type, project, scope, status, title, summary, tags_json, version
     FROM notes WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC LIMIT 120`,
  )
    .bind(...binds)
    .all<RawHeaderRow>();

  const headers: NoteHeaderRecord[] = rows.results.map((r) => {
    let tags: string[] = [];
    try {
      tags = JSON.parse(r.tags_json || "[]") as string[];
    } catch {
      tags = [];
    }
    return {
      id: r.id,
      note_key: r.note_key || r.id.slice(0, 8).toUpperCase(),
      type: r.type,
      project: r.project,
      scope: r.scope,
      status: r.status,
      title: r.title,
      summary: r.summary,
      tags,
      version: r.version,
    };
  });

  if (headers.length === 0) {
    return { selectedKeys: [], scannedCount: 0, headers: [] };
  }

  const indexLines = headers
    .map(
      (h) =>
        `${h.note_key} | type=${h.type} | project=${h.project} | status=${h.status} | tags=${h.tags.join(",") || "none"} | title=${h.title} | summary=${h.summary || "none"}`,
    )
    .join("\n");

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `User question: ${input.message}\n\nClassified Header Index (headers & ID keys only):\n<header_index>\n${indexLines}\n</header_index>`,
      config: {
        systemInstruction:
          "You are a search index router. Inspect ONLY the note_key IDs, classification types, tags, titles, and summary headers inside <header_index>. Select up to 5 note_key values most relevant to answering the user question, prioritizing verified notes over draft/disputed/superseded ones.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selected_keys: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Up to 5 matching note_key IDs (for example FACT-001).",
            },
          },
          required: ["selected_keys"],
        },
      },
    });

    const parsed = JSON.parse((response.text || "{}").trim()) as { selected_keys?: string[] };
    const validKeyMap = new Map(headers.map((h) => [h.note_key.toUpperCase(), h.note_key]));
    const selectedKeys: string[] = [];
    for (const candidate of parsed.selected_keys || []) {
      const canonical = validKeyMap.get(String(candidate).trim().toUpperCase());
      if (canonical && !selectedKeys.includes(canonical)) {
        selectedKeys.push(canonical);
      }
      if (selectedKeys.length >= 5) break;
    }

    return { selectedKeys, scannedCount: headers.length, headers };
  } catch (err) {
    if (err instanceof AppError) throw err;
    const msg = err instanceof Error ? err.message : "Header index routing failed.";
    throw new AppError("ai_provider_error", `Header search failed: ${msg}`, 502);
  }
}
