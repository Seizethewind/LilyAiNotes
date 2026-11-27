import { AppError, MAX_NOTE_BYTES } from "../types/env";
import { hasBinarySignature } from "./hasBinarySignature";
import { validateUtf8Text } from "./validateUtf8Text";

export function validateUpload(filename: string, raw: Uint8Array): string {
  const sig = hasBinarySignature(raw);
  if (sig === "pdf") {
    throw new AppError(
      "pdf_requires_extraction",
      "PDF files must be converted to text before storing in D1. Use the document converter or /api/v1/notes/extract-pdf.",
      415,
    );
  }
  if (sig === "binary") {
    throw new AppError(
      "invalid_file_content",
      "Binary executables, archives, and image files cannot be stored directly as text notes.",
      415,
    );
  }

  const text = validateUtf8Text(raw, MAX_NOTE_BYTES);
  const dotIdx = filename.lastIndexOf(".");
  const ext = dotIdx >= 0 ? filename.slice(dotIdx).toLowerCase() : "";
  if (ext === ".json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AppError("invalid_json", "JSON document contains invalid JSON syntax.", 422);
    }
    const pretty = JSON.stringify(parsed, null, 2);
    if (new TextEncoder().encode(pretty).byteLength > MAX_NOTE_BYTES) {
      throw new AppError(
        "payload_too_large",
        `Pretty-printed JSON exceeds maximum allowed size of ${MAX_NOTE_BYTES} bytes.`,
        413,
      );
    }
    return pretty;
  }

  return text;
}
