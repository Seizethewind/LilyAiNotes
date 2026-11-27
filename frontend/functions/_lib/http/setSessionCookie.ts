import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "../types/env";

export function buildSessionCookieHeader(
  token: string,
  secure: boolean,
  maxAge = SESSION_TTL_SECONDS,
): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
