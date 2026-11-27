import { authenticateRequest } from "../../../_lib/auth/authenticateRequest";
import { jsonResponse } from "../../../_lib/http/jsonResponse";
import { searchNotes } from "../../../_lib/notes/searchNotes";
import type { Env } from "../../../_lib/types/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = await authenticateRequest(request, env);
  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit");
  const parsedLimit = rawLimit ? Number(rawLimit) : undefined;

  const items = await searchNotes(env.DB, principal.workspaceId, {
    q: url.searchParams.get("q") || undefined,
    project: url.searchParams.get("project") || undefined,
    type: url.searchParams.get("type") || undefined,
    scope: url.searchParams.get("scope") || undefined,
    status: url.searchParams.get("status") || undefined,
    tag: url.searchParams.get("tag") || undefined,
    sortBy: url.searchParams.get("sort_by") || undefined,
    sortDir: url.searchParams.get("sort_dir") || undefined,
    limit: parsedLimit && Number.isFinite(parsedLimit) ? parsedLimit : undefined,
  });

  return jsonResponse(items);
};
