export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;
  const saltBytes = parts[2].match(/.{1,2}/g)?.map((h) => parseInt(h, 16));
  const expectedBytes = parts[3].match(/.{1,2}/g)?.map((h) => parseInt(h, 16));
  if (!saltBytes || !expectedBytes) return false;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new Uint8Array(saltBytes), iterations, hash: "SHA-256" },
    keyMaterial,
    expectedBytes.length * 8,
  );
  const actual = new Uint8Array(bits);
  if (actual.length !== expectedBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) {
    diff |= actual[i] ^ expectedBytes[i];
  }
  return diff === 0;
}
