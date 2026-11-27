// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@google/genai", () => ({
  Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          type: "config",
          summary: "Wrangler D1 binding configuration for Pages.",
          tags: ["wrangler", "Cloudflare D1"],
          reason: "JSON/TOML infrastructure configuration.",
        }),
      }),
    },
  })),
}));

import * as registerHandler from "../../functions/api/v1/auth/register";
import * as classifyHandler from "../../functions/api/v1/notes/classify";
import * as notesHandler from "../../functions/api/v1/notes/index";
import * as searchHandler from "../../functions/api/v1/notes/search";
import * as tagsHandler from "../../functions/api/v1/tags/index";
import type { Env } from "../../functions/_lib/types/env";
import { invokeHandler } from "../helpers/invokeHandler";
import { createMockD1 } from "../helpers/mockD1";

describe("classification, note_key allocation, tags, and field sorting", () => {
  it("classifies notes, allocates prefix ID keys, facets tags, and sorts/filters cleanly", async () => {
    const env: Env = { DB: createMockD1(), APP_SECRET_KEY: "test-secret-key-at-least-32-bytes" };
    const reg = await invokeHandler(registerHandler.onRequestPost, env, {
      method: "POST",
      body: { email: "cls@example.com", display_name: "Classifier", password: "password123" },
    });
    const { session_token } = (await reg.json()) as { session_token: string };
    const auth = { Authorization: `Bearer ${session_token}` };

    const ruleRes = await invokeHandler(classifyHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { filename: "wrangler.json", content: '{"d1_databases": [{"binding": "DB"}]}', use_ai: false },
    });
    expect(ruleRes.status).toBe(200);
    expect(await ruleRes.json()).toMatchObject({ type: "config", source: "rules" });

    expect((await invokeHandler(classifyHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { content: '{"port": 3000}', use_ai: true },
    })).status).toBe(503);

    const aiRes = await invokeHandler(classifyHandler.onRequestPost, { ...env, GEMINI_API_KEY: "test-key" }, {
      method: "POST",
      headers: auth,
      body: { title: "Wrangler Config", content: '{"binding":"DB"}', use_ai: true },
    });
    expect(aiRes.status).toBe(200);
    expect(await aiRes.json()).toMatchObject({
      type: "config",
      tags: ["wrangler", "cloudflare-d1"],
      source: "gemini",
    });

    const cfg1 = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { title: "Zebra Config", type: "config", scope: "global", tags: ["Cloudflare D1", "ops"], content: '{"a":1}' },
    });
    const cfg2 = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { title: "Alpha Config", type: "config", scope: "project", tags: ["ops"], content: '{"b":2}' },
    });
    const proc1 = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { title: "Deploy Steps", type: "procedure", scope: "global", tags: ["deploy"], content: "1. Build\n2. Deploy" },
    });

    expect(((await cfg1.json()) as { note_key: string; tags: string[] }).note_key).toBe("CFG-001");
    expect(((await cfg2.json()) as { note_key: string }).note_key).toBe("CFG-002");
    expect(((await proc1.json()) as { note_key: string }).note_key).toBe("PROC-001");

    const tagsRes = await invokeHandler(tagsHandler.onRequestGet, env, { headers: auth });
    expect(await tagsRes.json()).toEqual([
      { tag: "ops", count: 2 },
      { tag: "cloudflare-d1", count: 1 },
      { tag: "deploy", count: 1 },
    ]);

    const sortedListRes = await invokeHandler(notesHandler.onRequestGet, env, {
      url: "https://lily.example.com/api/v1/notes?type=config&tag=ops&sort_by=title&sort_dir=asc",
      headers: auth,
    });
    const sortedTitles = ((await sortedListRes.json()) as Array<{ title: string }>).map((n) => n.title);
    expect(sortedTitles).toEqual(["Alpha Config", "Zebra Config"]);

    const keySearchRes = await invokeHandler(searchHandler.onRequestGet, env, {
      url: "https://lily.example.com/api/v1/notes/search?q=PROC-001",
      headers: auth,
    });
    expect(await keySearchRes.json()).toMatchObject([{ note_key: "PROC-001", title: "Deploy Steps" }]);
  });
});
