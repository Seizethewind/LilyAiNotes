import { Copy } from "lucide-react";
import { useState } from "react";

import type { EndpointDocItem, HttpMethod } from "~/types/docs";

interface EndpointDetailViewProps {
  endpoint: EndpointDocItem;
  baseUrl: string;
}

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "text-emerald-700",
  POST: "text-blue-700",
  PATCH: "text-amber-700",
  DELETE: "text-red-700",
};

function buildCurlSnippet(endpoint: EndpointDocItem, baseUrl: string): string {
  const query = endpoint.sampleQuery ? `?${endpoint.sampleQuery}` : "";
  const url = `${baseUrl}/api/v1${endpoint.path}${query}`;
  const lines = [`curl -X ${endpoint.method} "${url}"`];
  if (endpoint.auth !== "Public") {
    lines.push('  -H "Authorization: Bearer LilyAiApikey..."');
  }
  if (endpoint.sampleBody) {
    lines.push('  -H "Content-Type: application/json"');
    lines.push(`  -d '${JSON.stringify(endpoint.sampleBody)}'`);
  }
  return lines.join(" \\\n");
}

export function EndpointDetailView({ endpoint, baseUrl }: EndpointDetailViewProps) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const curlSnippet = buildCurlSnippet(endpoint, baseUrl);

  function handleCopyCurl() {
    void navigator.clipboard?.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className={`font-mono font-semibold ${METHOD_COLOR[endpoint.method]}`}>{endpoint.method}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono font-medium text-slate-900">/api/v1{endpoint.path}</span>
          <span aria-hidden="true">·</span>
          <span>Auth: {endpoint.auth}</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{endpoint.title}</h2>
        <p className="text-sm leading-relaxed text-slate-600">{endpoint.summary}</p>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-900">Parameters & Fields</h3>
        {endpoint.params.length === 0 ? (
          <p className="text-xs text-slate-500">This endpoint requires no path, query, or JSON body parameters.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="h-10 px-3 font-semibold text-slate-900">Name</th>
                  <th className="h-10 px-3 font-semibold text-slate-900">Location</th>
                  <th className="h-10 px-3 font-semibold text-slate-900">Type</th>
                  <th className="h-10 px-3 font-semibold text-slate-900">Required</th>
                  <th className="h-10 px-3 font-semibold text-slate-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {endpoint.params.map((param) => (
                  <tr key={`${param.location}-${param.name}`} className="hover:bg-slate-50/70">
                    <td className="min-h-[40px] px-3 py-2 font-mono font-medium text-slate-900">{param.name}</td>
                    <td className="min-h-[40px] px-3 py-2 text-slate-600">{param.location}</td>
                    <td className="min-h-[40px] px-3 py-2 font-mono text-slate-600">{param.type}</td>
                    <td className="min-h-[40px] px-3 py-2 text-slate-700">
                      {param.required ? "Required" : "Optional"}
                    </td>
                    <td className="min-h-[40px] px-3 py-2 text-slate-600">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-900">cURL Example</h3>
          <button
            type="button"
            onClick={handleCopyCurl}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{copiedCurl ? "Copied" : "Copy cURL"}</span>
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs leading-relaxed text-slate-100">
          {curlSnippet}
        </pre>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {endpoint.sampleBody && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-900">Sample Request JSON</h3>
            <pre className="max-h-60 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800">
              {JSON.stringify(endpoint.sampleBody, null, 2)}
            </pre>
          </div>
        )}
        <div className={`space-y-1.5 ${endpoint.sampleBody ? "" : "lg:col-span-2"}`}>
          <h3 className="text-xs font-semibold text-slate-900">Sample Response JSON</h3>
          <pre className="max-h-60 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800">
            {JSON.stringify(endpoint.sampleResponse, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
