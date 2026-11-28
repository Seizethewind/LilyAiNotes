import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { isGoogleConfigured } from "../../../../_lib/google/googleConfig";
import { jsonResponse } from "../../../../_lib/http/jsonResponse";
import type { Env } from "../../../../_lib/types/env";

/** Public: tells the UI whether to show Google controls, and whether the caller is connected. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const enabled = isGoogleConfigured(env);
  const principal = await authenticateRequest(request, env).catch(() => null);
  const linked =
    principal?.kind === "human"
      ? Boolean(
          await env.DB.prepare("SELECT 1 AS ok FROM user_identities WHERE provider = 'google' AND user_id = ?")
            .bind(principal.subjectId)
            .first(),
        )
      : false;
  return jsonResponse({ enabled, linked });
};
