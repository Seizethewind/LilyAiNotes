import { AppError, MAX_NOTE_BYTES } from "../types/env";

export function validateUtf8Text(raw: Uint8Array, maxBytes = MAX_NOTE_BYTES): string {
  if (raw.byteLength === 0) {
    throw new AppError("empty_input", "Content must not be empty.", 422);
  }
  if (raw.byteLength > maxBytes) {
    throw new AppError(
      "payload_too_large",
      `Content exceeds maximum allowed size of ${maxBytes} bytes.`,
      413,
    );
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    throw new AppError("invalid_utf8", "Content must be valid UTF-8 text.", 422);
  }
  if (!text.trim()) {
    throw new AppError("empty_input", "Content must not be whitespace only.", 422);
  }
  return text;
}
