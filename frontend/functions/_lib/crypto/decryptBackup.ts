export async function decryptBackup(payload: Uint8Array, secretKey: string): Promise<Uint8Array> {
  if (!secretKey) {
    throw new Error("BACKUP_ENCRYPTION_KEY must be configured.");
  }
  if (payload.length <= 12) {
    throw new Error("Corrupted encrypted backup payload.");
  }
  const keyDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secretKey));
  const aesKey = await crypto.subtle.importKey("raw", keyDigest, "AES-GCM", false, ["decrypt"]);
  const iv = payload.slice(0, 12);
  const cipher = payload.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, cipher);
  return new Uint8Array(plain);
}
