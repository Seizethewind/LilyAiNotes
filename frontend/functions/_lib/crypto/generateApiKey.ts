const KEY_PREFIX = "LilyAiApikey";
const ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const RANDOM_LENGTH = 20;
const MAX_UNBIASED_BYTE = Math.floor(256 / ALPHANUMERIC_CHARS.length) * ALPHANUMERIC_CHARS.length;

export function generateApiKey(): { fullKey: string; prefix: string } {
  let suffix = "";
  const buffer = new Uint8Array(32);

  while (suffix.length < RANDOM_LENGTH) {
    crypto.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && suffix.length < RANDOM_LENGTH; i++) {
      const byte = buffer[i];
      if (byte < MAX_UNBIASED_BYTE) {
        suffix += ALPHANUMERIC_CHARS[byte % ALPHANUMERIC_CHARS.length];
      }
    }
  }

  const fullKey = `${KEY_PREFIX}${suffix}`;
  return { fullKey, prefix: fullKey.slice(0, KEY_PREFIX.length + 4) };
}
