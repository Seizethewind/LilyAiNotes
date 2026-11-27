import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { buildSessionCookieHeader } from "../../../_lib/http/setSessionCookie";
import type { Env } from "../../../_lib/types/env";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secure = env.COOKIE_SECURE === "true" && new URL(request.url).protocol === "https:";
  return jsonResponse(
    { status: "signed_out" },
    200,
    { "Set-Cookie": buildSessionCookieHeader("", secure, 0) },
  );
};
