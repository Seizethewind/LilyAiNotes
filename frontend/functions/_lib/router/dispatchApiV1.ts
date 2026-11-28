import * as agentGuideRoute from "../../api/v1/agent/guide";
import * as agentIngestRoute from "../../api/v1/agent/ingest";
import * as assistantChat from "../../api/v1/assistant/chat";
import * as auditRoute from "../../api/v1/audit";
import * as loginRoute from "../../api/v1/auth/login";
import * as logoutRoute from "../../api/v1/auth/logout";
import * as meRoute from "../../api/v1/auth/me";
import * as registerRoute from "../../api/v1/auth/register";
import * as conversationsRoute from "../../api/v1/conversations";
import * as exportsRoute from "../../api/v1/exports";
import * as healthRoute from "../../api/v1/health";
import * as keysIdRoute from "../../api/v1/keys/[id]";
import * as keysIndexRoute from "../../api/v1/keys/index";
import * as knowledgeRoute from "../../api/v1/knowledge";
import * as memoryRoute from "../../api/v1/memory";
import * as notesTrashRoute from "../../api/v1/notes-trash";
import * as noteFlagRoute from "../../api/v1/notes/[id]/flag";
import * as noteIdRoute from "../../api/v1/notes/[id]/index";
import * as noteLinksRoute from "../../api/v1/notes/[id]/links";
import * as noteRestoreRoute from "../../api/v1/notes/[id]/restore";
import * as noteVerifyRoute from "../../api/v1/notes/[id]/verify";
import * as noteVersionsRoute from "../../api/v1/notes/[id]/versions";
import * as notesClassifyRoute from "../../api/v1/notes/classify";
import * as notesExtractPdfRoute from "../../api/v1/notes/extract-pdf";
import * as notesIndexRoute from "../../api/v1/notes/index";
import * as notesSearchRoute from "../../api/v1/notes/search";
import * as notesUploadRoute from "../../api/v1/notes/upload";
import * as providersRoute from "../../api/v1/providers";
import * as tagsIndexRoute from "../../api/v1/tags/index";
import * as topicsIdRoute from "../../api/v1/topics/[id]";
import * as workspacesRoute from "../../api/v1/workspaces";
import { errorResponse } from "../http/errorResponse";
import { jsonResponse } from "../http/jsonResponse";
import type { Env } from "../types/env";
import { ensureDevSchema } from "./ensureDevSchema";

type HandlerMap = Partial<Record<string, PagesFunction<Env>>>;

function buildContext(request: Request, env: Env, params: Record<string, string>) {
  return {
    request: request as unknown as Parameters<PagesFunction<Env>>[0]["request"],
    env: { ...env, ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } } as Parameters<
      PagesFunction<Env>
    >[0]["env"],
    params,
    waitUntil: () => {},
    passThroughOnException: () => {},
    next: async () => new Response("Not found", { status: 404 }),
    data: {},
    functionPath: "",
  };
}

export async function dispatchApiV1(request: Request, env: Env | undefined): Promise<Response> {
  if (!env?.DB) {
    return jsonResponse({ error: { code: "database_unavailable", message: "D1 binding unavailable." } }, 503);
  }
  try {
    await ensureDevSchema(env.DB);
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
    const method = request.method.toUpperCase();

    const staticRoutes: Record<string, HandlerMap> = {
      "/api/v1/health": { GET: healthRoute.onRequestGet },
      "/api/v1/auth/register": { POST: registerRoute.onRequestPost },
      "/api/v1/auth/login": { POST: loginRoute.onRequestPost },
      "/api/v1/auth/logout": { POST: logoutRoute.onRequestPost },
      "/api/v1/auth/me": { GET: meRoute.onRequestGet },
      "/api/v1/keys": { GET: keysIndexRoute.onRequestGet, POST: keysIndexRoute.onRequestPost },
      "/api/v1/audit": { GET: auditRoute.onRequestGet },
      "/api/v1/workspaces": { GET: workspacesRoute.onRequestGet, POST: workspacesRoute.onRequestPost },
      "/api/v1/notes/search": { GET: notesSearchRoute.onRequestGet },
      "/api/v1/notes/classify": { POST: notesClassifyRoute.onRequestPost },
      "/api/v1/notes/extract-pdf": { POST: notesExtractPdfRoute.onRequestPost },
      "/api/v1/notes/upload": { POST: notesUploadRoute.onRequestPost },
      "/api/v1/notes": { GET: notesIndexRoute.onRequestGet, POST: notesIndexRoute.onRequestPost },
      "/api/v1/tags": { GET: tagsIndexRoute.onRequestGet },
      "/api/v1/notes-trash": { GET: notesTrashRoute.onRequestGet, DELETE: notesTrashRoute.onRequestDelete },
      "/api/v1/knowledge": { ANY: knowledgeRoute.onRequest },
      "/api/v1/memory": { ANY: memoryRoute.onRequest },
      "/api/v1/conversations": { ANY: conversationsRoute.onRequest },
      "/api/v1/agent/guide": { GET: agentGuideRoute.onRequestGet },
      "/api/v1/agent/ingest": { POST: agentIngestRoute.onRequestPost },
      "/api/v1/assistant/chat": { POST: assistantChat.onRequestPost },
      "/api/v1/providers": { ANY: providersRoute.onRequest },
      "/api/v1/exports": { GET: exportsRoute.onRequestGet },
    };

    const staticMatch = staticRoutes[pathname];
    if (staticMatch) {
      const fn = staticMatch[method] || staticMatch.ANY;
      if (!fn) return jsonResponse({ error: { code: "method_not_allowed", message: "Method not allowed." } }, 405);
      return await fn(buildContext(request, env, {}));
    }

    const keysMatch = pathname.match(/^\/api\/v1\/keys\/([^/]+)$/);
    if (keysMatch && method === "DELETE") {
      return await keysIdRoute.onRequestDelete(buildContext(request, env, { id: keysMatch[1] }));
    }

    const topicMatch = pathname.match(/^\/api\/v1\/topics\/([^/]+)$/);
    if (topicMatch && method === "GET") {
      return await topicsIdRoute.onRequestGet(buildContext(request, env, { id: topicMatch[1] }));
    }

    const noteSubMatch = pathname.match(/^\/api\/v1\/notes\/([^/]+)\/(versions|links|flag|verify|restore)$/);
    if (noteSubMatch) {
      const [, id, sub] = noteSubMatch;
      const subMap: Record<string, HandlerMap> = {
        versions: { GET: noteVersionsRoute.onRequestGet },
        links: { GET: noteLinksRoute.onRequestGet },
        flag: { POST: noteFlagRoute.onRequestPost },
        verify: { POST: noteVerifyRoute.onRequestPost },
        restore: { POST: noteRestoreRoute.onRequestPost },
      };
      const fn = subMap[sub]?.[method];
      if (!fn) return jsonResponse({ error: { code: "method_not_allowed", message: "Method not allowed." } }, 405);
      return await fn(buildContext(request, env, { id }));
    }

    const noteIdMatch = pathname.match(/^\/api\/v1\/notes\/([^/]+)$/);
    if (noteIdMatch) {
      const map: HandlerMap = {
        GET: noteIdRoute.onRequestGet,
        PATCH: noteIdRoute.onRequestPatch,
        DELETE: noteIdRoute.onRequestDelete,
      };
      const fn = map[method];
      if (!fn) return jsonResponse({ error: { code: "method_not_allowed", message: "Method not allowed." } }, 405);
      return await fn(buildContext(request, env, { id: noteIdMatch[1] }));
    }

    return jsonResponse({ error: { code: "not_found", message: "API route not found." } }, 404);
  } catch (err) {
    return errorResponse(err);
  }
}
