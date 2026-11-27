// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn().mockResolvedValue({
  text: "# Quarterly Report\n\nExtracted PDF text from Gemini fallback.",
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

import * as registerHandler from "../../functions/api/v1/auth/register";
import * as keysHandler from "../../functions/api/v1/keys/index";
import * as extractPdfHandler from "../../functions/api/v1/notes/extract-pdf";
import * as uploadHandler from "../../functions/api/v1/notes/upload";
import type { Env } from "../../functions/_lib/types/env";
import { invokeHandler } from "../helpers/invokeHandler";
import { createMockD1 } from "../helpers/mockD1";

describe("document upload and PDF-to-text API", () => {
  it("accepts universal UTF-8 uploads with JSON pretty-print and secures Gemini PDF fallback", async () => {
    const env: Env = { DB: createMockD1(), APP_SECRET_KEY: "test-secret-key-at-least-32-bytes" };
    const reg = await invokeHandler(registerHandler.onRequestPost, env, {
      method: "POST",
      body: { email: "doc@example.com", display_name: "Doc User", password: "password123" },
    });
    const { session_token } = (await reg.json()) as { session_token: string };
    const auth = { Authorization: `Bearer ${session_token}` };

    const keyRes = await invokeHandler(keysHandler.onRequestPost, env, {
      method: "POST",
      headers: auth,
      body: { name: "Agent", scope: "read+write" },
    });
    const { plaintext_key } = (await keyRes.json()) as { plaintext_key: string };

    const jsonForm = new FormData();
    jsonForm.append("file", new File(['{"service":"lily","mode":"d1"}'], "manifest.json", { type: "application/json" }));
    const jsonUpload = await invokeHandler(uploadHandler.onRequestPost, env, { method: "POST", headers: auth, formData: jsonForm });
    expect(jsonUpload.status).toBe(201);
    const jsonNote = (await jsonUpload.json()) as { content: string };
    expect(jsonNote.content).toBe('{\n  "service": "lily",\n  "mode": "d1"\n}');

    const logForm = new FormData();
    logForm.append("file", new File(["[INFO] D1 ready\n"], "system.log", { type: "text/plain" }));
    const logUpload = await invokeHandler(uploadHandler.onRequestPost, env, { method: "POST", headers: auth, formData: logForm });
    expect(logUpload.status).toBe(201);

    const pdfBytes = new TextEncoder().encode("%PDF-1.7\n%mock-scanned-pdf");
    const agentPdfForm = new FormData();
    agentPdfForm.append("file", new File([pdfBytes], "scan.pdf", { type: "application/pdf" }));
    expect((await invokeHandler(extractPdfHandler.onRequestPost, env, {
      method: "POST",
      headers: { Authorization: `Bearer ${plaintext_key}` },
      formData: agentPdfForm,
    })).status).toBe(403);

    const badPdfForm = new FormData();
    badPdfForm.append("file", new File(["not a pdf"], "fake.pdf", { type: "application/pdf" }));
    expect((await invokeHandler(extractPdfHandler.onRequestPost, env, { method: "POST", headers: auth, formData: badPdfForm })).status).toBe(415);

    const noKeyForm = new FormData();
    noKeyForm.append("file", new File([pdfBytes], "scan.pdf", { type: "application/pdf" }));
    expect((await invokeHandler(extractPdfHandler.onRequestPost, env, { method: "POST", headers: auth, formData: noKeyForm })).status).toBe(503);

    const pdfForm = new FormData();
    pdfForm.append("file", new File([pdfBytes], "quarterly-report.pdf", { type: "application/pdf" }));
    const okRes = await invokeHandler(extractPdfHandler.onRequestPost, { ...env, GEMINI_API_KEY: "test-key" }, {
      method: "POST",
      headers: auth,
      formData: pdfForm,
    });
    expect(okRes.status).toBe(200);
    expect(await okRes.json()).toMatchObject({
      title: "quarterly-report",
      method: "pdf-gemini",
      model: "gemini-4-hydrogen",
      exceedsLimit: false,
    });
  });
});
