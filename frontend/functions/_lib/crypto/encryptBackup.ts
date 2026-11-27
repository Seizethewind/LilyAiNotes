export async function encryptBackup(plaintext: Uint8Array, secretKey: string): Promise<Uint8Array> {
  if (!secretKey) {
    throw new Error("BACKUP_ENCRYPTION_KEY must be configured.");
  }
  const keyDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secretKey));
  const aesKey = await crypto.subtle.importKey("raw", keyDigest, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plaintext.slice());
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return out;
}
