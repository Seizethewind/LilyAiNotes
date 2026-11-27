import { useEffect, useState } from "react";

import { AppShell } from "~/components/layout/AppShell";

export default function WorkspaceRoute() {
  const [isolated, setIsolated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsolated(typeof window !== "undefined" ? Boolean(window.crossOriginIsolated) : false);
  }, []);

  return (
    <AppShell title="WebContainers Workspace" breadcrumb="Execution Layer">
      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-2 border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Browser Node.js Runtime Readiness (Phase 7)
          </h2>
          <p className="text-sm text-slate-600">
            WebContainers requires cross-origin isolation (COOP: same-origin and COEP: require-corp),
            configured in Cloudflare Pages <code className="font-mono text-xs">public/_headers</code> and{" "}
            <code className="font-mono text-xs">vite.config.ts</code>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Cross-Origin Isolation</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {isolated === null ? "Checking..." : isolated ? "Enabled" : "Not Active in Current Frame"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Runtime Boundary</p>
            <p className="mt-1 text-sm text-slate-700">
              Browser-only Node.js execution. Database persistence remains owned by Cloudflare Pages Functions + D1.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
