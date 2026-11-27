// @vitest-environment node
import { describe, expect, it } from "vitest";

import * as loginHandler from "../../functions/api/v1/auth/login";
import * as registerHandler from "../../functions/api/v1/auth/register";
import * as healthHandler from "../../functions/api/v1/health";
import * as knowledgeHandler from "../../functions/api/v1/knowledge";
import * as trashHandler from "../../functions/api/v1/notes-trash";
import * as flagHandler from "../../functions/api/v1/notes/[id]/flag";
import * as noteDetailHandler from "../../functions/api/v1/notes/[id]/index";
import * as linksHandler from "../../functions/api/v1/notes/[id]/links";
import * as restoreHandler from "../../functions/api/v1/notes/[id]/restore";
import * as verifyHandler from "../../functions/api/v1/notes/[id]/verify";
import * as versionsHandler from "../../functions/api/v1/notes/[id]/versions";
import * as notesHandler from "../../functions/api/v1/notes/index";
import * as searchHandler from "../../functions/api/v1/notes/search";
import * as uploadHandler from "../../functions/api/v1/notes/upload";
import type { Env } from "../../functions/_lib/types/env";
import { invokeHandler } from "../helpers/invokeHandler";
import { createMockD1 } from "../helpers/mockD1";

describe("notes API lifecycle on Cloudflare D1 + FTS5", () => {
  it("runs health, auth, FTS5 search, topic/supersedes links, versions, trash, and D1 text import", async () => {
    const env: Env = { DB: createMockD1(), APP_SECRET_KEY: "test-secret-key-at-least-32-bytes" };

    const health = await invokeHandler(healthHandler.onRequestGet, env);
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ status: "ok", database: "ok" });

    await invokeHandler(registerHandler.onRequestPost, env, {
      method: "POST",
      body: { email: "alice@example.com", display_name: "Alice", password: "password123" },
    });
    const loginRes = await invokeHandler(loginHandler.onRequestPost, env, {
      method: "POST",
      body: { email: "alice@example.com", password: "password123" },
    });
    const { session_token } = (await loginRes.json()) as { session_token: string };
    const authHeader = { Authorization: `Bearer ${session_token}` };

    const topicRes = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: authHeader,
      body: { title: "D1 Storage Architecture", summary: "FTS5 ranking guide", content: "# Overview\nCloudflare D1 supports full text search." },
    });
    expect(topicRes.status).toBe(201);
    const topic = (await topicRes.json()) as { id: string; version: number };

    const childRes = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: authHeader,
      body: { title: "D1 FTS5 Detail", parent_id: topic.id, supersedes_id: topic.id, content: "Updated FTS5 notes." },
    });
    expect(childRes.status).toBe(201);
    const child = (await childRes.json()) as { id: string };

    const linksRes = await invokeHandler(linksHandler.onRequestGet, env, { params: { id: child.id }, headers: authHeader });
    expect(await linksRes.json()).toMatchObject({
      parent_id: topic.id,
      supersedes_id: topic.id,
      parent: { id: topic.id, title: "D1 Storage Architecture" },
    });

    const patchRes = await invokeHandler(noteDetailHandler.onRequestPatch, env, {
      method: "PATCH",
      params: { id: child.id },
      headers: authHeader,
      body: { content: "# Overview\nCloudflare D1 stores all text natively.", change_note: "Clarified D1 storage" },
    });
    expect(((await patchRes.json()) as { version: number }).version).toBe(2);

    const versionsRes = await invokeHandler(versionsHandler.onRequestGet, env, { params: { id: child.id }, headers: authHeader });
    expect(((await versionsRes.json()) as Array<{ version: number }>).map((v) => v.version)).toEqual([2, 1]);

    await invokeHandler(verifyHandler.onRequestPost, env, { method: "POST", params: { id: child.id }, headers: authHeader, body: { status: "verified" } });

    const searchRes = await invokeHandler(searchHandler.onRequestGet, env, {
      url: "https://lily.example.com/api/v1/notes/search?q=Cloudflare",
      headers: authHeader,
    });
    const hits = (await searchRes.json()) as Array<{ id: string; status: string }>;
    expect(hits.some((h) => h.id === child.id && h.status === "verified")).toBe(true);

    const flagRes = await invokeHandler(flagHandler.onRequestPost, env, {
      method: "POST",
      params: { id: child.id },
      headers: authHeader,
      body: { reason: "Needs update" },
    });
    expect(((await flagRes.json()) as { status: string }).status).toBe("disputed");

    await invokeHandler(noteDetailHandler.onRequestDelete, env, { method: "DELETE", params: { id: child.id }, headers: authHeader });
    expect(((await (await invokeHandler(trashHandler.onRequestGet, env, { headers: authHeader })).json()) as unknown[]).length).toBe(1);
    await invokeHandler(restoreHandler.onRequestPost, env, { method: "POST", params: { id: child.id }, headers: authHeader });
    expect(((await (await invokeHandler(trashHandler.onRequestGet, env, { headers: authHeader })).json()) as unknown[]).length).toBe(0);

    const form = new FormData();
    form.append("file", new File(["# Imported\nStored directly in D1"], "guide.md", { type: "text/markdown" }));
    const uploadRes = await invokeHandler(uploadHandler.onRequestPost, env, { method: "POST", headers: authHeader, formData: form });
    expect(uploadRes.status).toBe(201);
    expect(((await uploadRes.json()) as { content: string }).content).toContain("Stored directly in D1");

    expect((await invokeHandler(knowledgeHandler.onRequest, env, { headers: authHeader })).status).toBe(501);
  });
});
