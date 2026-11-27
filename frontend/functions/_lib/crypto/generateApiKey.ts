export function generateApiKey(): { fullKey: string; prefix: string } {
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  const token = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const fullKey = `lily_k_${token}`;
  return { fullKey, prefix: fullKey.slice(0, 14) };
}
