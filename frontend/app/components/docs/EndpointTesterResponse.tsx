import { Copy } from "lucide-react";
import { useState } from "react";

import type { LiveTestResult } from "~/services/api/runEndpointTest";

interface EndpointTesterResponseProps {
  result: LiveTestResult;
}

export function EndpointTesterResponse({ result }: EndpointTesterResponseProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard?.writeText(result.bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-mono font-semibold tabular-nums ${result.ok ? "text-emerald-700" : "text-red-700"}`}>
            HTTP {result.status} {result.ok ? "OK" : "Error"}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-slate-600 tabular-nums">{result.durationMs} ms</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-slate-500">{result.contentType}</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{copied ? "Copied" : "Copy Response"}</span>
        </button>
      </div>
      <pre className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs text-slate-100">
        {result.bodyText}
      </pre>
    </div>
  );
}
