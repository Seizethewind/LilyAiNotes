import { Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EndpointTesterAuthBar } from "~/components/docs/EndpointTesterAuthBar";
import { EndpointTesterResponse } from "~/components/docs/EndpointTesterResponse";
import { getApiBaseUrl } from "~/services/api/apiClient";
import { runEndpointTest, type LiveTestResult } from "~/services/api/runEndpointTest";
import type { EndpointDocItem } from "~/types/docs";

interface EndpointLiveTesterProps {
  endpoint: EndpointDocItem;
  sessionToken: string | null;
  signedInEmail: string | null;
}

function extractPathVariables(path: string): string[] {
  return Array.from(path.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);
}

export function EndpointLiveTester({ endpoint, sessionToken, signedInEmail }: EndpointLiveTesterProps) {
  const pathVars = useMemo(() => extractPathVariables(endpoint.path), [endpoint.path]);
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryText, setQueryText] = useState(endpoint.sampleQuery || "");
  const [bodyText, setBodyText] = useState(
    endpoint.sampleBody ? JSON.stringify(endpoint.sampleBody, null, 2) : "",
  );
  const [authMode, setAuthMode] = useState<"session" | "apiKey">("session");
  const [customApiKey, setCustomApiKey] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LiveTestResult | null>(null);

  useEffect(() => {
    setPathValues({});
    setQueryText(endpoint.sampleQuery || "");
    setBodyText(endpoint.sampleBody ? JSON.stringify(endpoint.sampleBody, null, 2) : "");
    setError(null);
    setResult(null);
  }, [endpoint]);

  const resolvedPath = useMemo(() => {
    let next = endpoint.path;
    for (const variable of pathVars) {
      const value = encodeURIComponent((pathValues[variable] || "").trim() || variable);
      next = next.replace(`{${variable}}`, value);
    }
    const cleanQuery = queryText.trim().replace(/^\?/, "");
    return cleanQuery ? `${next}?${cleanQuery}` : next;
  }, [endpoint.path, pathVars, pathValues, queryText]);

  async function handleSend() {
    setError(null);
    setResult(null);

    if (authMode === "apiKey" && !customApiKey.trim()) {
      setError("Paste a LilyAiApikey... token or switch to Current Session.");
      return;
    }

    if ((endpoint.method === "POST" || endpoint.method === "PATCH") && bodyText.trim()) {
      try {
        JSON.parse(bodyText.trim());
      } catch {
        setError("Request body must be valid JSON before sending.");
        return;
      }
    }

    setRunning(true);
    try {
      const res = await runEndpointTest({
        method: endpoint.method,
        resolvedPath,
        authMode,
        sessionToken,
        customApiKey,
        bodyText,
      });
      setResult(res);
    } catch {
      setError("Unable to reach the workspace API. Verify the server is running.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Live API Tester</h3>
          <p className="mt-0.5 font-mono text-xs text-slate-500">
            {endpoint.method} {getApiBaseUrl()}
            {resolvedPath}
          </p>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={() => void handleSend()}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{running ? "Sending..." : "Send Request"}</span>
        </button>
      </div>

      <EndpointTesterAuthBar
        authMode={authMode}
        signedInEmail={signedInEmail}
        customApiKey={customApiKey}
        queryText={queryText}
        onAuthModeChange={setAuthMode}
        onCustomApiKeyChange={setCustomApiKey}
        onQueryTextChange={setQueryText}
      />

      {pathVars.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {pathVars.map((variable) => (
            <div key={variable} className="space-y-1.5">
              <label htmlFor={`path-var-${variable}`} className="block text-xs font-medium text-slate-700">
                Path Parameter: <span className="font-mono">{variable}</span>
              </label>
              <input
                id={`path-var-${variable}`}
                value={pathValues[variable] || ""}
                onChange={(e) => setPathValues({ ...pathValues, [variable]: e.target.value })}
                placeholder={`Enter ${variable} (e.g. FACT-001 or UUID)`}
                className="min-h-[40px] w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {(endpoint.method === "POST" || endpoint.method === "PATCH") && (
        <div className="space-y-1.5">
          <label htmlFor="docs-body-json" className="block text-xs font-medium text-slate-700">
            JSON Request Body
          </label>
          <textarea
            id="docs-body-json"
            rows={7}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-700">{error}</p>}

      {result && <EndpointTesterResponse result={result} />}
    </section>
  );
}
