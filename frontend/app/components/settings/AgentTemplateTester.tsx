import { useState } from "react";

import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import type { AgentDryRunResponse } from "~/types/api";

interface AgentTemplateTesterProps {
  token: string | null;
  defaultProject: string;
}

export function AgentTemplateTester({ token, defaultProject }: AgentTemplateTesterProps) {
  const [payloadText, setPayloadText] = useState(() =>
    JSON.stringify(
      {
        template_version: "1.0",
        sender: "external-ai-agent",
        title: "Cloudflare D1 Backup Check",
        content: "1. Verify active D1 note count.\n2. Export workspace JSON before schema updates.",
        project: defaultProject || "general",
        scope: "project",
        auto_classify: false,
      },
      null,
      2,
    ),
  );
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<AgentDryRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate() {
    setError(null);
    setResult(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      setError("Payload must be valid JSON before validation.");
      return;
    }
    setTesting(true);
    try {
      const res = await apiRequest<AgentDryRunResponse>("/agent/ingest?dry_run=true", {
        method: "POST",
        token,
        body: { ...parsed, validate_only: true },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Template validation failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-900">Validate Intake Template (Dry Run)</p>
        <button
          type="button"
          disabled={testing}
          onClick={() => void handleValidate()}
          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
        >
          {testing ? "Validating..." : "Validate Sample Payload"}
        </button>
      </div>
      <textarea
        rows={8}
        value={payloadText}
        onChange={(e) => setPayloadText(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 focus:border-blue-700 focus:outline-none"
      />
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-semibold">
            Template valid · Queue status: {result.review_status} · Project: {result.resolved_project}
          </p>
          <p className="mt-1 font-mono text-emerald-800">
            Classified as {result.note_preview.type} ({result.classification_source}) · Tags:{" "}
            {result.note_preview.tags.map((t) => `#${t}`).join(" ") || "none"}
          </p>
          <p className="mt-1 text-emerald-800">Summary: {result.note_preview.summary}</p>
        </div>
      )}
    </div>
  );
}
