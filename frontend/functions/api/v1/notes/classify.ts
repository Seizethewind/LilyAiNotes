import { classifyWithGemini } from "../../../_lib/ai/classifyWithGemini";
import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { classifyByRules } from "../../../_lib/classification/classifyByRules";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../_lib/http/parseJsonBody";
import { AppError } from "../../../_lib/types/env";
import type { Env } from "../../../_lib/types/env";

interface ClassifyBody {
  title?: string;
  content?: string;
  filename?: string;
  use_ai?: boolean;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const principal = await authenticateRequest(request, env);
  const body = await parseJsonBody<ClassifyBody>(request);
  const content = (body.content || "").trim();
  if (!content) {
    throw new AppError("validation_error", "Content is required to classify a note.", 422);
  }

  if (!body.use_ai) {
    return jsonResponse(
      classifyByRules({
        title: body.title,
        content,
        filename: body.filename,
      }),
    );
  }

  const tagRows = await env.DB.prepare(
    "SELECT tag, COUNT(*) AS cnt FROM note_tags WHERE workspace_id = ? GROUP BY tag ORDER BY cnt DESC, tag ASC LIMIT 40",
  )
    .bind(principal.workspaceId)
    .all<{ tag: string }>();

  const suggestion = await classifyWithGemini(env, {
    title: body.title,
    content,
    filename: body.filename,
    existingTags: tagRows.results.map((r) => r.tag),
  });
  return jsonResponse(suggestion);
};
