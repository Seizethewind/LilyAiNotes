// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@google/genai", () => ({
  Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          type: "procedure",
          summary: "Step-by-step D1 rotation runbook submitted by external agent.",
          tags: ["ops", "runbook"],
          reason: "Operational step list.",
        }),
      }),
    },
  })),
}));

import * as agentGuideHandler from "../../functions/api/v1/agent/guide";
import * as agentIngestHandler from "../../functions/api/v1/agent/ingest";
import * as registerHandler from "../../functions/api/v1/auth/register";
import * as keysHandler from "../../functions/api/v1/keys/index";
import * as noteDetailHandler from "../../functions/api/v1/notes/[id]/index";
import * as noteVerifyHandler from "../../functions/api/v1/notes/[id]/verify";
import * as notesHandler from "../../functions/api/v1/notes/index";
import type { Env } from "../../functions/_lib/types/env";
import { invokeHandler } from "../helpers/invokeHandler";
import { createMockD1 } from "../helpers/mockD1";

describe("external AI intake template, project-scoped keys, and unverified queue", () => {
  it("scopes keys by optional project, validates v1.0 templates, queues unverified, and approves as human", async () => {
    const env: Env = { DB: createMockD1(), APP_SECRET_KEY: "test-secret-key-at-least-32-bytes" };
    const reg = await invokeHandler(registerHandler.onRequestPost, env, {
      method: "POST",
      body: { email: "ext@example.com", display_name: "Owner", password: "password123" },
    });
    const { session_token } = (await reg.json()) as { session_token: string };
    const humanAuth = { Authorization: `Bearer ${session_token}` };

    const seedOps = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: humanAuth,
      body: { title: "Ops Baseline", project: "ops", type: "fact", content: "Ops baseline note", status: "verified" },
    });
    const seedOpsNote = (await seedOps.json()) as { note_key: string };

    const seedPriv = await invokeHandler(notesHandler.onRequestPost, env, {
      method: "POST",
      headers: humanAuth,
      body: { title: "Finance Secret", project: "finance", type: "fact", content: "Finance only note", status: "verified" },
    });
    const seedPrivNote = (await seedPriv.json()) as { id: string; note_key: string };

    const keyRes = await invokeHandler(keysHandler.onRequestPost, env, {
      method: "POST",
      headers: humanAuth,
      body: { name: "Ops Bot", scope: "read+write", allowed_project: "ops" },
    });
    expect(keyRes.status).toBe(201);
    const opsKey = ((await keyRes.json()) as { plaintext_key: string }).plaintext_key;
    const botAuth = { Authorization: `Bearer ${opsKey}` };

    const guideRes = await invokeHandler(agentGuideHandler.onRequestGet, env, { headers: botAuth });
    expect(guideRes.status).toBe(200);
    expect(await guideRes.json()).toMatchObject({
      template_version: "1.0",
      caller: { allowed_project: "ops", scope: "read+write" },
    });

    const pullByKey = await invokeHandler(noteDetailHandler.onRequestGet, env, {
      params: { id: seedOpsNote.note_key },
      headers: botAuth,
    });
    expect(pullByKey.status).toBe(200);
    expect(((await pullByKey.json()) as { title: string }).title).toBe("Ops Baseline");

    expect(
      (await invokeHandler(noteDetailHandler.onRequestGet, env, { params: { id: seedPrivNote.id }, headers: botAuth })).status,
    ).toBe(403);
    expect(
      (await invokeHandler(notesHandler.onRequestGet, env, { url: "https://lily.example.com/api/v1/notes?project=finance", headers: botAuth })).status,
    ).toBe(403);

    expect(
      (await invokeHandler(agentIngestHandler.onRequestPost, env, {
        method: "POST",
        headers: botAuth,
        body: { template_version: "0.9", sender: "bot", title: "Bad", content: "Body" },
      })).status,
    ).toBe(422);

    expect(
      (await invokeHandler(agentIngestHandler.onRequestPost, env, {
        method: "POST",
        headers: botAuth,
        body: { template_version: "1.0", sender: "bot", title: "Try Verify", content: "Body", status: "verified" },
      })).status,
    ).toBe(422);

    const dryRunRes = await invokeHandler(agentIngestHandler.onRequestPost, env, {
      method: "POST",
      headers: botAuth,
      body: { template_version: "1.0", sender: "ops-agent", title: "Dry Run", content: "1. Step one\n2. Step two", validate_only: true },
    });
    expect(dryRunRes.status).toBe(200);
    expect(await dryRunRes.json()).toMatchObject({ valid: true, dry_run: true, review_status: "unverified", resolved_project: "ops" });

    const ingestRes = await invokeHandler(agentIngestHandler.onRequestPost, { ...env, GEMINI_API_KEY: "test-key" }, {
      method: "POST",
      headers: botAuth,
      body: {
        template_version: "1.0",
        sender: "ops-agent",
        title: "Rotate D1 Token",
        content: "1. Create new API token.\n2. Revoke old token.",
        auto_classify: true,
        related_note_keys: [seedOpsNote.note_key],
      },
    });
    expect(ingestRes.status).toBe(201);
    const ingestData = (await ingestRes.json()) as {
      review_status: string;
      classification_source: string;
      note: { id: string; note_key: string; status: string; project: string; type: string };
    };
    expect(ingestData.review_status).toBe("unverified");
    expect(ingestData.classification_source).toBe("gemini");
    expect(ingestData.note).toMatchObject({
      note_key: "PROC-001",
      status: "unverified",
      project: "ops",
      type: "procedure",
    });

    const approveRes = await invokeHandler(noteVerifyHandler.onRequestPost, env, {
      method: "POST",
      params: { id: ingestData.note.note_key },
      headers: humanAuth,
      body: { status: "verified" },
    });
    expect(approveRes.status).toBe(200);
    expect(((await approveRes.json()) as { status: string }).status).toBe("verified");
  });
});
