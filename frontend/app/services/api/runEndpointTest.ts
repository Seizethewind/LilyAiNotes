import { getApiBaseUrl } from "~/services/api/apiClient";
import type { HttpMethod } from "~/types/docs";

export interface LiveTestResult {
  status: number;
  ok: boolean;
  durationMs: number;
  contentType: string;
  bodyText: string;
}

export interface RunEndpointTestInput {
  method: HttpMethod;
  resolvedPath: string;
  authMode: "session" | "apiKey";
  sessionToken: string | null;
  customApiKey: string;
  bodyText: string;
}

export async function runEndpointTest(input: RunEndpointTestInput): Promise<LiveTestResult> {
  const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest" };
  if (input.authMode === "session" && input.sessionToken) {
    headers.Authorization = `Bearer ${input.sessionToken}`;
  } else if (input.authMode === "apiKey" && input.customApiKey.trim()) {
    headers.Authorization = `Bearer ${input.customApiKey.trim()}`;
  }

  let payload: string | undefined;
  if (input.method === "POST" || input.method === "PATCH") {
    const trimmed = input.bodyText.trim();
    if (trimmed) {
      JSON.parse(trimmed);
      payload = trimmed;
      headers["Content-Type"] = "application/json";
    }
  }

  const started = performance.now();
  const res = await fetch(`${getApiBaseUrl()}${input.resolvedPath}`, {
    method: input.method,
    headers,
    body: payload,
    credentials: input.authMode === "session" ? "include" : "omit",
  });
  const rawText = await res.text();
  let formatted = rawText;
  try {
    if (rawText) formatted = JSON.stringify(JSON.parse(rawText), null, 2);
  } catch {
    formatted = rawText;
  }

  return {
    status: res.status,
    ok: res.ok,
    durationMs: Math.round(performance.now() - started),
    contentType: res.headers.get("Content-Type") || "text/plain",
    bodyText: formatted || "(empty response body)",
  };
}
