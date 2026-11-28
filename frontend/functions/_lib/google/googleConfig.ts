import type { Env } from "../types/env";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const OAUTH_COOKIE_NAME = "lily_google_oauth";

export function isGoogleConfigured(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim() && env.APP_SECRET_KEY?.trim());
}

export function googleRedirectUri(request: Request): string {
  return `${new URL(request.url).origin}/api/v1/auth/google/callback`;
}

/** Short-lived cookie that ties the callback to the browser that started the flow. */
export function buildOauthCookie(value: string, request: Request, env: Env, maxAge = 600): string {
  const secure = env.COOKIE_SECURE === "true" && new URL(request.url).protocol === "https:";
  const parts = [
    `${OAUTH_COOKIE_NAME}=${value}`,
    `Max-Age=${maxAge}`,
    "Path=/api/v1/auth/google",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
