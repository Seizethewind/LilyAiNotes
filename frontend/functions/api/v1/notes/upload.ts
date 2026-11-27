import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../../_lib/auth/requireHumanSession";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { createNote } from "../../../_lib/notes/createNote";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";
import { validateUpload } from "../../../_lib/validation/validateUpload";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AppError("validation_error", "Request must be multipart/form-data.", 422);
  }

  const uploaded = form.get("file");
  if (!uploaded || typeof uploaded === "string") {
    throw new AppError("validation_error", "Uploaded file is required.", 422);
  }

  const file = uploaded as File;
  const rawBytes = new Uint8Array(await file.arrayBuffer());
  const extractedText = validateUpload(file.name, rawBytes);

  const customTitle = String(form.get("title") || "").trim();
  const baseTitle = file.name.replace(/\.[^.]+$/, "").trim() || file.name;
  const parentId = String(form.get("parent_id") || "").trim() || null;
  const supersedesId = String(form.get("supersedes_id") || "").trim() || null;

  const created = await createNote(env.DB, principal, {
    title: customTitle || baseTitle,
    summary: String(form.get("summary") || "").trim(),
    content: extractedText,
    type: String(form.get("type") || "fact"),
    project: String(form.get("project") || "general"),
    scope: String(form.get("scope") || "project"),
    parent_id: parentId,
    supersedes_id: supersedesId,
    change_note: `Imported text document ${file.name}`,
  });

  return jsonResponse(created, 201);
};
