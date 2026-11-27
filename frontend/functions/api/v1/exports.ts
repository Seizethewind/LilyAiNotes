import { buildAuditStatement } from "../../_lib/audit/writeAuditLog";
import { authenticateRequest } from "../../_lib/auth/authenticateRequest";
import { requireHumanSession } from "../../_lib/auth/requireHumanSession";
import { formatNoteResponse } from "../../_lib/notes/getNoteResponse";
import type { NoteRow } from "../../_lib/notes/getNoteResponse";
import type { Env } from "../../_lib/types/env";

function renderMarkdownBundle(notes: Awaited<ReturnType<typeof formatNoteResponse>>[]): string {
  const header = `# LilyAiDataNotes Export\n\nExported at: ${new Date().toISOString()}\nTotal notes: ${notes.length}\n\n---\n`;
  const sections = notes.map((note) => {
    const meta = [
      `- **Key:** ${note.note_key} (${note.id})`,
      `- **Project:** ${note.project}`,
      `- **Type:** ${note.type} | **Status:** ${note.status} | **Version:** v${note.version}`,
      note.tags.length > 0 ? `- **Tags:** ${note.tags.join(", ")}` : null,
      note.summary ? `- **Summary:** ${note.summary}` : null,
      `- **Updated:** ${note.updated_at}`,
    ]
      .filter(Boolean)
      .join("\n");
    return `\n## ${note.title}\n\n${meta}\n\n${note.content}\n\n---\n`;
  });
  return `${header}${sections.join("")}`;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const principal = requireHumanSession(await authenticateRequest(request, env));
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "markdown" ? "markdown" : "json";
  const project = (url.searchParams.get("project") || "").trim();

  const clauses = ["workspace_id = ?", "deleted_at IS NULL"];
  const binds: unknown[] = [principal.workspaceId];
  if (project) {
    clauses.push("project = ?");
    binds.push(project);
  }

  const rows = await env.DB.prepare(
    `SELECT * FROM notes WHERE ${clauses.join(" AND ")} ORDER BY project ASC, updated_at DESC`,
  )
    .bind(...binds)
    .all<NoteRow>();
  const formatted = await Promise.all(rows.results.map((r) => formatNoteResponse(env.DB, r)));

  await env.DB.batch([
    buildAuditStatement(env.DB, {
      workspaceId: principal.workspaceId,
      actorType: "human",
      actorId: principal.subjectId,
      action: "workspace.export",
      resourceType: "workspace",
      resourceId: principal.workspaceId,
      details: { format, project: project || "all", note_count: formatted.length },
    }),
  ]);

  if (format === "markdown") {
    return new Response(renderMarkdownBundle(formatted), {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="lilyaidatanotes-export.md"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new Response(
    JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        workspace_id: principal.workspaceId,
        project: project || null,
        note_count: formatted.length,
        notes: formatted,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="lilyaidatanotes-export.json"',
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
};
