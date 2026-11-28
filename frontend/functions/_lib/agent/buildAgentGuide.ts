import type { AuthPrincipal } from "../types/env";

export function buildAgentGuide(principal: AuthPrincipal, origin: string) {
  const effectiveProject = principal.allowedProject || "general";
  return {
    service: "LilyAiDataNotes",
    template_version: "1.0",
    caller: {
      kind: principal.kind,
      display_name: principal.displayName,
      scope: principal.scope,
      allowed_project: principal.allowedProject,
    },
    pull_endpoints: [
      {
        method: "GET",
        path: `${origin}/api/v1/notes?status=verified&sort_by=updated_at&sort_dir=desc`,
        description: "List notes filtered by status, type, project, scope, or tag.",
      },
      {
        method: "GET",
        path: `${origin}/api/v1/notes/search?q=FACT-001`,
        description: "Search notes by readable ID key (e.g. FACT-001), title, summary, tags, or content.",
      },
      {
        method: "GET",
        path: `${origin}/api/v1/notes/{id_or_note_key}`,
        description: "Fetch one full note using either its UUID id or its readable note_key (e.g. FACT-001).",
      },
      {
        method: "GET",
        path: `${origin}/api/v1/tags`,
        description: "List existing workspace tag facets to reuse canonical tags.",
      },
      {
        method: "POST",
        path: `${origin}/api/v1/assistant/chat`,
        description: "Ask the vault AI a question; it scans headers and note_keys first before reading selected note bodies.",
      },
    ],
    push_endpoint: {
      method: "POST",
      path: `${origin}/api/v1/agent/ingest`,
      dry_run_path: `${origin}/api/v1/agent/ingest?dry_run=true`,
      required_scope: "read+write",
    },
    sample_template: {
      template_version: "1.0",
      sender: "external-ai-agent",
      title: "D1 Backup Retention Policy",
      content: "Store all active workspace notes as UTF-8 plain text or Markdown in Cloudflare D1.",
      type: "fact",
      summary: "Workspace notes persist as UTF-8 text inside Cloudflare D1.",
      tags: ["cloudflare-d1", "backups"],
      project: effectiveProject,
      scope: "project",
      auto_classify: true,
    },
    guidelines: [
      "Include Authorization: Bearer LilyAiApikey... on every request.",
      "Search or browse note_key headers before pulling full bodies.",
      "Always send template_version: '1.0', sender, title, and UTF-8 content (<= 100 KB).",
      "Omit type, summary, or tags to let the vault auto-classify them from content.",
      "Never include secrets, tokens, or API keys inside note text (blocked with HTTP 422).",
      "All external AI submissions are stored with status 'unverified' until a human approves them.",
    ],
  };
}
