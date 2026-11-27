import { useCallback, useEffect, useState } from "react";

import { AppShell } from "~/components/layout/AppShell";
import { ApiKeysPanel } from "~/components/settings/ApiKeysPanel";
import { useSession } from "~/context/SessionContext";
import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import { downloadWorkspaceExport } from "~/services/api/downloadWorkspaceExport";
import type { ApiKeyRecord, AuditLogRecord } from "~/types/api";

export default function SettingsRoute() {
  const { user, token } = useSession();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [audit, setAudit] = useState<AuditLogRecord[]>([]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [keyRows, auditRows] = await Promise.all([
        apiRequest<ApiKeyRecord[]>("/keys", { token }),
        apiRequest<AuditLogRecord[]>("/audit?limit=25", { token }),
      ]);
      setKeys(keyRows);
      setAudit(auditRows);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load security settings.");
    }
  }, [user, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreateKey(name: string, scope: "read" | "read+write") {
    setError(null);
    setRevealedKey(null);
    try {
      const created = await apiRequest<ApiKeyRecord>("/keys", {
        method: "POST",
        token,
        body: { name, scope },
      });
      setRevealedKey(created.plaintext_key || null);
      void loadData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create API key.");
    }
  }

  async function handleRevoke(id: string) {
    try {
      await apiRequest(`/keys/${id}`, { method: "DELETE", token });
      void loadData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to revoke API key.");
    }
  }

  async function handleExport(format: "markdown" | "json") {
    try {
      await downloadWorkspaceExport({ format, token });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to export workspace notes.");
    }
  }

  return (
    <AppShell title="API Keys, Exports & Audit" breadcrumb="Settings">
      {!user ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Human sign-in is required to manage API keys, export workspace text, and inspect the audit log.
        </div>
      ) : (
        <div className="space-y-8">
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <ApiKeysPanel
            keys={keys}
            revealedKey={revealedKey}
            onCreate={handleCreateKey}
            onRevoke={handleRevoke}
          />

          <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Workspace Text Backup Export</h2>
              <p className="mt-1 text-xs text-slate-500">
                Download all active workspace notes stored in D1 as portable Markdown or JSON.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleExport("markdown")}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Download Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => void handleExport("json")}
                className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap"
              >
                Download JSON (.json)
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Recent Audit Activity</h2>
            <div className="divide-y divide-slate-100">
              {audit.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 py-2.5 text-xs">
                  <div>
                    <span className="font-mono font-medium text-slate-900">{entry.action}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-600">
                      {entry.actor_type} ({entry.resource_type})
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
