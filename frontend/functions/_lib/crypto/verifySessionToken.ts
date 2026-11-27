export interface SessionClaims {
  sub: string;
  ws: string;
  exp: number;
}

export async function verifySessionToken(
  token: string,
  secretKey: string,
): Promise<SessionClaims | null> {
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sigHex = token.slice(dotIdx + 1);
  const sigBytes = sigHex.match(/.{1,2}/g)?.map((h) => parseInt(h, 16));
  if (!sigBytes) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(sigBytes),
    new TextEncoder().encode(encoded),
  );
  if (!valid) return null;

  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (encoded.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as Partial<SessionClaims>;
    if (
      typeof parsed.sub !== "string" ||
      typeof parsed.ws !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { sub: parsed.sub, ws: parsed.ws, exp: parsed.exp };
  } catch {
    return null;
  }
}
