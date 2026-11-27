import { jsonResponse } from "../../_lib/http/jsonResponse";
import type { Env } from "../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    await env.DB.prepare("SELECT 1 AS ok").first();
    return jsonResponse({ status: "ok", database: "ok", runtime: "cloudflare-pages-d1" });
  } catch {
    return jsonResponse(
      { error: { code: "database_unavailable", message: "D1 database check failed." } },
      503,
    );
  }
};
