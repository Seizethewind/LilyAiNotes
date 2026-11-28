interface EndpointTesterAuthBarProps {
  authMode: "session" | "apiKey";
  signedInEmail: string | null;
  customApiKey: string;
  queryText: string;
  onAuthModeChange: (mode: "session" | "apiKey") => void;
  onCustomApiKeyChange: (value: string) => void;
  onQueryTextChange: (value: string) => void;
}

export function EndpointTesterAuthBar({
  authMode,
  signedInEmail,
  customApiKey,
  queryText,
  onAuthModeChange,
  onCustomApiKeyChange,
  onQueryTextChange,
}: EndpointTesterAuthBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-slate-700">Authentication</span>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onAuthModeChange("session")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                authMode === "session" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              {signedInEmail ? "Current Session" : "Session (Not Signed In)"}
            </button>
            <button
              type="button"
              onClick={() => onAuthModeChange("apiKey")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                authMode === "apiKey" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              Custom API Key
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="docs-query-params" className="block text-xs font-medium text-slate-700">
            Query String (Optional)
          </label>
          <input
            id="docs-query-params"
            value={queryText}
            onChange={(e) => onQueryTextChange(e.target.value)}
            placeholder="status=verified&limit=10"
            className="min-h-[40px] w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>
      </div>

      {authMode === "apiKey" && (
        <div className="space-y-1.5">
          <label htmlFor="docs-api-key" className="block text-xs font-medium text-slate-700">
            Bearer API Key (kept in memory only)
          </label>
          <input
            id="docs-api-key"
            type="password"
            value={customApiKey}
            onChange={(e) => onCustomApiKeyChange(e.target.value)}
            placeholder="LilyAiApikey..."
            className="min-h-[40px] w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
