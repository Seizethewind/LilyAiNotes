// @vitest-environment node
import { describe, expect, it } from "vitest";

import * as auditHandler from "../../functions/api/v1/audit";
import * as registerHandler from "../../functions/api/v1/auth/register";
import * as exportsHandler from "../../functions/api/v1/exports";
import * as keysDeleteHandler from "../../functions/api/v1/keys/[id]";
import * as keysHandler from "../../functions/api/v1/keys/index";
import * as noteDetailHandler from "../../functions/api/v1/notes/[id]/index";
import * as noteVerifyHandler from "../../functions/api/v1/notes/[id]/verify";
import * as notesHandler from "../../functions/api/v1/notes/index";
import type { Env } from "../../functions/_lib/types/env";
import { invokeHandler } from "../helpers/invokeHandler";
import { createMockD1 } from "../helpers/mockD1";

function buildEnv(): Env {
  return { DB: createMockD1(), APP_SECRET_KEY: "test-secret-key-at-least-32-bytes" };
}

describe("security boundaries and AI key scopes", () => {
  it("blocks AI keys from human-only routes and enforces draft-only writes", async () => {
    const env = buildEnv();
    const regRes = await invokeHandler(registerHandler.onRequestPost, env, {
      method: "POST",
      body: { email: "sec@example.com", display_name: "Sec Owner", password: "password123" },
    });
    const { session_token } = (await regRes.json()) as { session_token: string };

    const readKeyRes = await invokeHandler(keysHandler.onRequestPost, env, {
      method: "POST",
      headers: { Authorization: `Bearer ${session_token}` },
      body: { name: "Reader Agent", scope: "read" },
    });
    const readKey = ((await readKeyRes.json()) as { plaintext_key: string }).plaintext_key;

    const writeKeyRes = await invokeHandler(keysHandler.onRequestPost, env, {
      method: "POST",
      headers: { Authorization: `Bearer ${session_token}` },
      body: { name: "Writer Agent", scope: "read+write" },
    });
    const writeKeyData = (await writeKeyRes.json()) as { id: string; plaintext_key: string };

    expect((await invokeHandler(keysHandler.onRequestGet, env, { headers: { Authorization: `Bearer ${writeKeyData.plaintext_key}` } })).status).toBe(403);
    expect((await invokeHandler(auditHandler.onRequestGet, env, { headers: { Authorization: `Bearer ${writeKeyData.plaintext_key}` } })).status).toBe(403);
    expect((await invokeHandler(exportsHandler.onRequestGet, env, { headers: { Authorization: `Bearer ${writeKeyData.plaintext_key}` } })).status).toBe(403);
    expect((await invokeHandler(notesHandler.onRequestPost, env, { method: "POST", headers: { Authorization: `Bearer ${readKey}` }, body: { title: "Denied", content: "No write" } })).status).toBe(403);

    const createdRes = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: { Authorization: `Bearer ${writeKeyData.plaintext_key}` },
      body: { title: "Agent Draft", content: "Agent tried verified", status: "verified" },
    });
    expect(createdRes.status).toBe(201);
    const created = (await createdRes.json()) as { id: string; status: string };
    expect(created.status).toBe("draft");

    expect((await invokeHandler(noteVerifyHandler.onRequestPost, env, { method: "POST", params: { id: created.id }, headers: { Authorization: `Bearer ${writeKeyData.plaintext_key}` }, body: { status: "verified" } })).status).toBe(403);
    expect((await invokeHandler(noteDetailHandler.onRequestDelete, env, { method: "DELETE", params: { id: created.id }, headers: { Authorization: `Bearer ${writeKeyData.plaintext_key}` } })).status).toBe(403);

    expect((await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: { Authorization: `Bearer ${session_token}` },
      body: { title: "Leaked", content: "OPENAI=sk-1234567890abcdefghijklmnop" },
    })).status).toBe(422);

    await invokeHandler(keysDeleteHandler.onRequestDelete, env, {
      method: "DELETE",
      params: { id: writeKeyData.id },
      headers: { Authorization: `Bearer ${session_token}` },
    });
    expect((await invokeHandler(notesHandler.onRequestGet, env, { headers: { Authorization: `Bearer ${writeKeyData.plaintext_key}` } })).status).toBe(401);
  });
});
