import { useEffect, useState } from "react";

import { AgentTemplateTester } from "~/components/settings/AgentTemplateTester";
import { apiRequest } from "~/services/api/apiClient";
import type { AgentGuideResponse } from "~/types/api";

type GuideTab = "pull" | "send" | "guidelines" | "prompt";

interface ExternalAiGuidePanelProps {
  token: string | null;
  projects: string[];
}

export function ExternalAiGuidePanel({ token, projects }: ExternalAiGuidePanelProps) {
  const [tab, setTab] = useState<GuideTab>("pull");
  const [selectedProject, setSelectedProject] = useState("");
  const [guide, setGuide] = useState<AgentGuideResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<AgentGuideResponse>("/agent/guide", { token })
      .then(setGuide)
      .catch(() => setGuide(null));
  }, [token]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-app.pages.dev";
  const projectHint = selectedProject || "general";
  const sampleTemplateJson = JSON.stringify(
    {
      template_version: "1.0",
      sender: "external-ai-agent",
      title: "Concise note title",
      content: "Plain text or Markdown body (<= 100 KB). Never include secrets or tokens.",
      type: "fact",
      summary: "Optional 1-sentence summary (auto-classified if omitted)",
      tags: ["cloudflare-d1"],
      project: projectHint,
      scope: "project",
      auto_classify: true,
    },
    null,
    2,
  );

  const agentPrompt = [
    `You have API key access to the LilyAiDataNotes vault at ${baseUrl}/api/v1.`,
    `Always pass header: Authorization: Bearer <API_KEY>.`,
    selectedProject ? `Key scope is restricted to project '${selectedProject}'.` : `Always specify a concise project name.`,
    `GET DATA: 1) Call GET /notes/search?q=<topic_or_FACT-001> or GET /notes?status=verified&sort_by=updated_at&sort_dir=desc. 2) Fetch full text with GET /notes/{id_or_note_key}. 3) Or ask POST /assistant/chat which scans headers & note_keys first.`,
    `SEND DATA: Submit ONLY valid JSON matching template_version '1.0' to POST /agent/ingest with sender, title, content, and optional type (fact|decision|procedure|preference|code|log|config), summary, tags, project, supersedes_note_key. Omit type/summary/tags to let the vault auto-classify.`,
    `RULE: All external AI submissions enter the 'unverified' review queue until a human verifies them. Never try to mark submissions as verified.`,
  ].join("\n\n");

  function copyBlock(id: string, value: string) {
    void navigator.clipboard?.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">External AI API Guide & Intake Template</h2>
          <p className="mt-1 text-xs text-slate-500">
            Share these pull endpoints, JSON v1.0 intake template, and rules with any external AI client holding an API key.
          </p>
        </div>
        <select
          aria-label="Preview examples for project"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          <option value="">All workspace projects</option>
          {projects.map((p) => (
            <option key={p} value={p}>Project: {p}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            ["pull", "Pull Data (GET)"],
            ["send", "Send Template (POST)"],
            ["guidelines", "AI Guidelines"],
            ["prompt", "Copy AI Prompt"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pull" && (
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            External AIs pull headers, search by readable ID key (<span className="font-mono">FACT-001</span>), fetch individual notes, or ask the header-routed Assistant:
          </p>
          <div className="space-y-2">
            {(guide?.pull_endpoints || []).map((ep) => (
              <div key={ep.path} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-mono font-medium text-slate-900">
                  {ep.method} {ep.path}
                </p>
                <p className="mt-1 text-slate-600">{ep.description}</p>
              </div>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-slate-100">
{`curl -H "Authorization: Bearer LilyAiApikey..." \\
  "${baseUrl}/api/v1/notes/FACT-001"`}
          </pre>
        </div>
      )}

      {tab === "send" && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono font-medium text-slate-800">POST {baseUrl}/api/v1/agent/ingest</p>
            <button
              type="button"
              onClick={() => copyBlock("template", sampleTemplateJson)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              {copiedId === "template" ? "Copied" : "Copy JSON Template"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-slate-100">
            {sampleTemplateJson}
          </pre>
          <AgentTemplateTester token={token} defaultProject={projectHint} />
        </div>
      )}

      {tab === "guidelines" && (
        <ul className="space-y-2 text-xs text-slate-700">
          {(guide?.guidelines || []).map((rule, i) => (
            <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              {i + 1}. {rule}
            </li>
          ))}
        </ul>
      )}

      {tab === "prompt" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-600">
              Paste this instruction block into your external AI agent alongside a{" "}
              <span className="font-mono">LilyAiApikey...</span> key:
            </p>
            <button
              type="button"
              onClick={() => copyBlock("prompt", agentPrompt)}
              className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap"
            >
              {copiedId === "prompt" ? "Copied" : "Copy Instructions"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800">
            {agentPrompt}
          </pre>
        </div>
      )}
    </section>
  );
}
