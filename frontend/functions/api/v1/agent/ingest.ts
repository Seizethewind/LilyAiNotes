import { validateAgentTemplate } from "../../../_lib/agent/validateAgentTemplate";
import type { AgentIntakePayload } from "../../../_lib/agent/validateAgentTemplate";
import { classifyWithGemini } from "../../../_lib/ai/classifyWithGemini";
import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { requireWriteScope } from "../../../_lib/auth/requireWriteScope";
import { resolveEffectiveProject } from "../../../_lib/auth/resolveEffectiveProject";
import { classifyByRules } from "../../../_lib/classification/classifyByRules";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { parseJsonBody } from "../../../_lib/http/parseJsonBody";
import { createNote } from "../../../_lib/notes/createNote";
import { findAccessibleNote } from "../../../_lib/notes/findAccessibleNote";
import type { Env } from "../../../_lib/types/env";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireWriteScope(await authenticateRequest(request, env));
  const raw = await parseJsonBody<AgentIntakePayload>(request);
  const template = validateAgentTemplate(raw);
  const project = resolveEffectiveProject(principal, template.project) || "general";
  const dryRun = template.validateOnly || new URL(request.url).searchParams.get("dry_run") === "true";

  const rules = classifyByRules({ title: template.title, content: template.content });
  let chosenType = template.type || rules.type;
  let chosenSummary = template.summary || rules.summary;
  let chosenTags = template.tags && template.tags.length > 0 ? template.tags : rules.tags;
  let classificationSource: "caller" | "rules" | "gemini" =
    template.type && template.summary && template.tags ? "caller" : "rules";

  const needsClassification = !template.type || !template.summary || !template.tags || template.tags.length === 0;
  if (template.autoClassify && needsClassification) {
    const tagRows = await env.DB.prepare(
      "SELECT tag FROM note_tags WHERE workspace_id = ? GROUP BY tag ORDER BY COUNT(*) DESC LIMIT 40",
    )
      .bind(principal.workspaceId)
      .all<{ tag: string }>();
    const ai = await classifyWithGemini(env, {
      title: template.title,
      content: template.content,
      existingTags: tagRows.results.map((r) => r.tag),
    });
    if (!template.type) chosenType = ai.type;
    if (!template.summary) chosenSummary = ai.summary || chosenSummary;
    if (!template.tags || template.tags.length === 0) chosenTags = ai.tags.length > 0 ? ai.tags : chosenTags;
    classificationSource = "gemini";
  }

  let supersedesId: string | null = null;
  if (template.supersedesNoteKey) {
    const target = await findAccessibleNote(env.DB, principal, template.supersedesNoteKey);
    supersedesId = target.id;
  }

  const relatedIds: string[] = [];
  for (const key of template.relatedNoteKeys) {
    const rel = await findAccessibleNote(env.DB, principal, key);
    if (!relatedIds.includes(rel.id)) relatedIds.push(rel.id);
  }

  if (dryRun) {
    return jsonResponse({
      valid: true,
      dry_run: true,
      review_status: "unverified",
      resolved_project: project,
      classification_source: classificationSource,
      note_preview: {
        title: template.title,
        type: chosenType,
        summary: chosenSummary,
        tags: chosenTags,
        project,
        scope: template.scope,
        supersedes_id: supersedesId,
        related_ids: relatedIds,
      },
    });
  }

  const created = await createNote(env.DB, principal, {
    title: template.title,
    summary: chosenSummary,
    content: template.content,
    type: chosenType,
    tags: chosenTags,
    project,
    scope: template.scope,
    status: "unverified",
    supersedes_id: supersedesId,
    related_ids: relatedIds,
    change_note: template.changeNote,
  });

  return jsonResponse(
    {
      note: created,
      review_status: created.status,
      classification_source: classificationSource,
      message: "Submission stored as unverified until reviewed and approved by a human.",
    },
    201,
  );
};
