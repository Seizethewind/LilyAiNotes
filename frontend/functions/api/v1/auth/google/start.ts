import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { getSessionSecret } from "../../../../_lib/auth/getSessionSecret";
import { requireHumanSession } from "../../../../_lib/auth/requireHumanSession";
import {
  GOOGLE_AUTH_URL,
  buildOauthCookie,
  googleRedirectUri,
  isGoogleConfigured,
} from "../../../../_lib/google/googleConfig";
import { sealOauthState } from "../../../../_lib/google/oauthState";
import type { Env } from "../../../../_lib/types/env";

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const mode = new URL(request.url).searchParams.get("mode") === "link" ? "link" : "login";
  if (!isGoogleConfigured(env)) {
    return new Response(null, { status: 302, headers: { Location: "/login?google_error=google_unconfigured" } });
  }
  let linkUserId: string | null = null;
  if (mode === "link") {
    try {
      linkUserId = requireHumanSession(await authenticateRequest(request, env)).subjectId;
    } catch {
      // This is a full page navigation, so show a page instead of a JSON error.
      return new Response(null, { status: 302, headers: { Location: "/login?google_error=unauthorized" } });
    }
  }

  const state = randomToken();
  const nonce = randomToken();
  const params = new URLSearchParams({
    client_id: (env.GOOGLE_CLIENT_ID || "").trim(),
    redirect_uri: googleRedirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account",
  });
  const sealed = await sealOauthState({ state, nonce, linkUserId }, getSessionSecret(env));
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${GOOGLE_AUTH_URL}?${params.toString()}`,
      "Set-Cookie": buildOauthCookie(sealed, request, env),
      "Cache-Control": "no-store",
    },
  });
};
