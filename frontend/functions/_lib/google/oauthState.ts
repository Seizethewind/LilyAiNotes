import { sha256Hex } from "../crypto/sha256Hex";

export interface OauthState {
  state: string;
  nonce: string;
  /** Set only when connecting Google to an already signed-in user. */
  linkUserId: string | null;
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  // The prefix keeps these signatures separate from session token signatures.
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`google-oauth:${value}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sealOauthState(input: OauthState, secret: string): Promise<string> {
  const body = `${input.state}.${input.nonce}.${input.linkUserId || "-"}`;
  return `${body}.${await hmac(body, secret)}`;
}

export async function openOauthState(value: string, secret: string): Promise<OauthState | null> {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [state, nonce, user, sig] = parts;
  const expected = await hmac(`${state}.${nonce}.${user}`, secret);
  // Compare digests so timing does not reveal how much of the signature matched.
  if ((await sha256Hex(sig)) !== (await sha256Hex(expected)) || !state || !nonce) return null;
  return { state, nonce, linkUserId: user === "-" ? null : user };
}
