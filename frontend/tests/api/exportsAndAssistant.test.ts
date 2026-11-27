// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn().mockImplementation(async (params: { config?: { responseMimeType?: string } }) => {
  if (params.config?.responseMimeType === "application/json") {
    return { text: JSON.stringify({ selected_keys: ["FACT-001"] }) };
  }
  return { text: "Based on [FACT-001] D1 Backup Policy, backups run in D1 text exports." };
});

vi.mock("@google/genai", () => ({
  Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

import * as assistantChatHandler from "../../functions/api/v1/assistant/chat";
import * as registerHandler from "../../functions/api/v1/auth/register";
import * as exportsHandler from "../../functions/api/v1/exports";
import * as keysHandler from "../../functions/api/v1/keys/index";
import * as notesHandler from "../../functions/api/v1/notes/index";
import type { Env } from "../../functions/_lib/types/env";
import { invokeHandler } from "../helpers/invokeHandler";
import { createMockD1 } from "../helpers/mockD1";

describe("workspace exports and header-and-ID assistant", () => {
  it("exports Markdown/JSON for humans only and routes assistant via header index + note_key", async () => {
    const env: Env = { DB: createMockD1(), APP_SECRET_KEY: "test-secret-key-at-least-32-bytes" };
    const reg = await invokeHandler(registerHandler.onRequestPost, env, {
      method: "POST",
      body: { email: "bob@example.com", display_name: "Bob", password: "password123" },
    });
    const { session_token } = (await reg.json()) as { session_token: string };
    const auth = { Authorization: `Bearer ${session_token}` };

    await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: {
        title: "D1 Backup Policy",
        project: "ops",
        type: "fact",
        tags: ["cloudflare-d1", "backups"],
        summary: "Backup export policy in Markdown and JSON.",
        content: "Export all text notes in Markdown or JSON.",
      },
    });

    const keyRes = await invokeHandler(keysHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { name: "Reader", scope: "read" },
    });
    const { plaintext_key } = (await keyRes.json()) as { plaintext_key: string };

    expect((await invokeHandler(exportsHandler.onRequestGet, env, { headers: { Authorization: `Bearer ${plaintext_key}` } })).status).toBe(403);

    const mdRes = await invokeHandler(exportsHandler.onRequestGet, env, {
      url: "https://lily.example.com/api/v1/exports?format=markdown&project=ops",
      headers: auth,
    });
    expect(mdRes.status).toBe(200);
    const mdText = await mdRes.text();
    expect(mdText).toContain("## D1 Backup Policy");
    expect(mdText).toContain("FACT-001");

    const jsonRes = await invokeHandler(exportsHandler.onRequestGet, env, {
      url: "https://lily.example.com/api/v1/exports?format=json",
      headers: auth,
    });
    expect(((await jsonRes.json()) as { note_count: number }).note_count).toBe(1);

    const noKeyRes = await invokeHandler(assistantChatHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { message: "How do backups work?" },
    });
    expect(noKeyRes.status).toBe(503);

    const envWithGemini: Env = { ...env, GEMINI_API_KEY: "test-gemini-key" };
    const chatRes = await invokeHandler(assistantChatHandler.onRequestPost, envWithGemini, {
      method: "POST",
      headers: auth,
      body: { message: "How do backups work?", project: "ops", type: "fact", tag: "backups" },
    });
    expect(chatRes.status).toBe(200);
    const chatJson = (await chatRes.json()) as {
      reply: string;
      scannedHeaders: number;
      selectedKeys: string[];
      citations: Array<{ note_key: string; title: string }>;
    };
    expect(chatJson.scannedHeaders).toBe(1);
    expect(chatJson.selectedKeys).toEqual(["FACT-001"]);
    expect(chatJson.reply).toContain("FACT-001");
    expect(chatJson.citations[0]).toMatchObject({ note_key: "FACT-001", title: "D1 Backup Policy" });
  });
});
