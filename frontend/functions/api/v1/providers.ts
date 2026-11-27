import { authenticateRequest } from "../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../_lib/http/jsonResponse";
import type { Env } from "../../_lib/types/env";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  requireHumanSession(await authenticateRequest(request, env));
  return jsonResponse(
    {
      error: {
        code: "not_implemented",
        message: "AI provider registry (Phase 5) is not implemented yet.",
      },
    },
    501,
  );
};
