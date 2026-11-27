import { errorResponse } from "../../functions/_lib/http/errorResponse";
import type { Env } from "../../functions/_lib/types/env";

export async function invokeHandler(
  handler: PagesFunction<Env>,
  env: Env,
  input: {
    url?: string;
    method?: string;
    body?: unknown;
    formData?: FormData;
    headers?: Record<string, string>;
    params?: Record<string, string>;
  } = {},
): Promise<Response> {
  const headers = new Headers(input.headers || {});
  let bodyInit: BodyInit | undefined;
  if (input.formData) {
    bodyInit = input.formData;
  } else if (input.body !== undefined) {
    headers.set("Content-Type", "application/json");
    bodyInit = JSON.stringify(input.body);
  }

  const request = new Request(input.url || "https://lily.example.com/api/v1/test", {
    method: input.method || "GET",
    headers,
    body: bodyInit,
  });

  try {
    return await handler({
      request: request as unknown as Parameters<PagesFunction<Env>>[0]["request"],
      env: {
        ...env,
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      } as Parameters<PagesFunction<Env>>[0]["env"],
      params: input.params || {},
      waitUntil: () => {},
      passThroughOnException: () => {},
      next: async () => new Response("Not found", { status: 404 }),
      data: {},
      functionPath: "",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
