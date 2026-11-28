import { AppError } from "../types/env";
import type { Env } from "../types/env";
import { GOOGLE_TOKEN_URL } from "./googleConfig";

export interface GoogleProfile {
  subject: string;
  email: string;
  name: string;
}

function decodeClaims(idToken: string): Record<string, unknown> {
  const part = idToken.split(".")[1] || "";
  const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (part.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

/**
 * Exchanges an authorization code for the user's Google profile.
 * The ID token comes straight from Google's token endpoint over HTTPS, authenticated with our
 * client secret, so its signature is not re-checked. Never pass this function a token from a browser.
 */
export async function exchangeGoogleCode(
  env: Env,
  input: { code: string; redirectUri: string; nonce: string },
): Promise<GoogleProfile> {
  const clientId = (env.GOOGLE_CLIENT_ID || "").trim();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: (env.GOOGLE_CLIENT_SECRET || "").trim(),
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!response.ok) {
    throw new AppError("google_exchange_failed", "Google rejected the sign-in code.", 502);
  }

  let claims: Record<string, unknown>;
  try {
    const tokens = (await response.json()) as { id_token?: string };
    claims = decodeClaims(tokens.id_token || "");
  } catch {
    throw new AppError("google_invalid_token", "Google returned an unreadable ID token.", 502);
  }

  const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  const notExpired = typeof claims.exp === "number" && claims.exp > Math.floor(Date.now() / 1000);
  if (!issuerOk || !notExpired || claims.aud !== clientId || claims.nonce !== input.nonce) {
    throw new AppError("google_invalid_token", "Google ID token failed validation.", 401);
  }
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  const verified = claims.email_verified === true || claims.email_verified === "true";
  if (typeof claims.sub !== "string" || !claims.sub || !email || !verified) {
    throw new AppError("google_email_unverified", "A verified Google email is required.", 403);
  }
  const name = typeof claims.name === "string" ? claims.name.trim() : "";
  return { subject: claims.sub, email, name: name || email.split("@")[0] };
}
