import { SESSION_TTL_SECONDS } from "../types/env";

export async function createSessionToken(
  userId: string,
  workspaceId: string,
  secretKey: string,
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload = JSON.stringify({
    sub: userId,
    ws: workspaceId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
  const encoded = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  const sigHex = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${encoded}.${sigHex}`;
}
