import { extractPdfWithGemini } from "../../../_lib/ai/extractPdfWithGemini";
import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { AppError, MAX_NOTE_BYTES, MAX_PDF_UPLOAD_BYTES } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";
import { hasBinarySignature } from "../../../_lib/validation/hasBinarySignature";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  requireHumanSession(await authenticateRequest(request, env));
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AppError("validation_error", "Request must be multipart/form-data.", 422);
  }

  const uploaded = form.get("file");
  if (!uploaded || typeof uploaded === "string") {
    throw new AppError("validation_error", "Uploaded PDF file is required.", 422);
  }

  const file = uploaded as File;
  const rawBytes = new Uint8Array(await file.arrayBuffer());
  if (rawBytes.byteLength === 0) {
    throw new AppError("empty_input", "Uploaded PDF file is empty.", 422);
  }
  if (rawBytes.byteLength > MAX_PDF_UPLOAD_BYTES) {
    throw new AppError("payload_too_large", "PDF file exceeds the 10 MB extraction limit.", 413);
  }
  if (hasBinarySignature(rawBytes) !== "pdf") {
    throw new AppError("unsupported_file_type", "File is not a valid PDF document.", 415);
  }

  const { text, model } = await extractPdfWithGemini(env, rawBytes, file.name);
  const byteLength = new TextEncoder().encode(text).byteLength;
  const title = file.name.replace(/\.pdf$/i, "").trim() || file.name;

  return jsonResponse({
    title,
    content: text,
    byteLength,
    exceedsLimit: byteLength > MAX_NOTE_BYTES,
    method: "pdf-gemini",
    model,
  });
};
