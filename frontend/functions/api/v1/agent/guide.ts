import { buildAgentGuide } from "../../../_lib/agent/buildAgentGuide";
import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import type { Env } from "../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = await authenticateRequest(request, env);
  const origin = new URL(request.url).origin;
  return jsonResponse(buildAgentGuide(principal, origin));
};
