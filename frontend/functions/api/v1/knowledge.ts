import { authenticateRequest } from "../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../_lib/http/jsonResponse";
import type { Env } from "../../_lib/types/env";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  await authenticateRequest(request, env);
  return jsonResponse(
    {
      error: {
        code: "not_implemented",
        message: "Knowledge graph explorer (Phase 6+) is not implemented yet.",
      },
    },
    501,
  );
};
