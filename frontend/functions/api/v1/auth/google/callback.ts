import { authenticateRequest } from "../../../../_lib/auth/authenticateRequest";
import { getSessionSecret } from "../../../../_lib/auth/getSessionSecret";
import { requireHumanSession } from "../../../../_lib/auth/requireHumanSession";
import { createSessionToken } from "../../../../_lib/crypto/createSessionToken";
import { exchangeGoogleCode } from "../../../../_lib/google/exchangeGoogleCode";
import {
  OAUTH_COOKIE_NAME,
  buildOauthCookie,
  googleRedirectUri,
  isGoogleConfigured,
} from "../../../../_lib/google/googleConfig";
import { openOauthState } from "../../../../_lib/google/oauthState";
import { linkGoogleAccount, signInWithGoogle } from "../../../../_lib/google/resolveGoogleUser";
import { buildSessionCookieHeader } from "../../../../_lib/http/setSessionCookie";
import { AppError } from "../../../../_lib/types/env";
import type { Env } from "../../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const cookies = request.headers.get("Cookie") || "";
  const stored = cookies.match(new RegExp(`(?:^|;\\s*)${OAUTH_COOKIE_NAME}=([^;]+)`))?.[1] || "";
  let linking = false;

  const redirect = (location: string, sessionCookie?: string) => {
    const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
    headers.append("Set-Cookie", buildOauthCookie("", request, env, 0));
    if (sessionCookie) headers.append("Set-Cookie", sessionCookie);
    return new Response(null, { status: 302, headers });
  };

  try {
    if (!isGoogleConfigured(env)) {
      throw new AppError("google_unconfigured", "Google sign-in is not configured.", 503);
    }
    const flow = await openOauthState(stored, getSessionSecret(env));
    if (!flow || url.searchParams.get("state") !== flow.state) {
      throw new AppError("google_state_mismatch", "Sign-in request expired or did not match.", 401);
    }
    const code = url.searchParams.get("code");
    if (!code) throw new AppError("google_cancelled", "Google sign-in was cancelled.", 401);

    // Check the existing session before spending the code when connecting an account.
    linking = Boolean(flow.linkUserId);
    const principal = linking ? requireHumanSession(await authenticateRequest(request, env)) : null;
    if (principal && principal.subjectId !== flow.linkUserId) {
      throw new AppError("google_state_mismatch", "The signed-in user changed during linking.", 401);
    }
    const profile = await exchangeGoogleCode(env, { code, nonce: flow.nonce, redirectUri: googleRedirectUri(request) });

    if (principal) {
      await linkGoogleAccount(env.DB, principal, profile);
      return redirect("/settings?google=connected");
    }
    const { userId, workspaceId } = await signInWithGoogle(env.DB, profile);
    const token = await createSessionToken(userId, workspaceId, getSessionSecret(env));
    const secure = env.COOKIE_SECURE === "true" && url.protocol === "https:";
    return redirect("/dashboard", buildSessionCookieHeader(token, secure));
  } catch (err) {
    if (!(err instanceof AppError)) console.error("Google sign-in failed:", err);
    const reason = err instanceof AppError ? err.code : "internal_error";
    // Settings only renders for signed-in users, so an expired session goes to the login page.
    const page = linking && reason !== "unauthorized" ? "/settings" : "/login";
    return redirect(`${page}?google_error=${encodeURIComponent(reason)}`);
  }
};
