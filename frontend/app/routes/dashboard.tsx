import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";

import { StatusLabel } from "~/components/documents/StatusLabel";
import { AppShell } from "~/components/layout/AppShell";
import { useSession } from "~/context/SessionContext";
import { ApiClientError, apiRequest, getApiBaseUrl } from "~/services/api/apiClient";
import type { HealthResponse, NoteRecord } from "~/types/api";

export default function DashboardRoute() {
  const { user, token } = useSession();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteRecord[]>([]);

  useEffect(() => {
    apiRequest<HealthResponse>("/health")
      .then((res) => {
        setHealth(res);
        setHealthError(null);
      })
      .catch((err) => {
        setHealth(null);
        setHealthError(err instanceof ApiClientError ? err.message : "Backend API unreachable.");
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    apiRequest<NoteRecord[]>("/notes", { token })
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [user, token]);

  const verifiedCount = notes.filter((n) => n.status === "verified").length;
  const unverifiedCount = notes.filter((n) => n.status === "unverified").length;
  const draftCount = notes.filter((n) => n.status === "draft").length;

  return (
    <AppShell title="Workspace Overview" breadcrumb="LilyAiDataNotes">
      <div className="space-y-8">
        {healthError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Cloudflare Pages API not connected</p>
            <p className="mt-1 text-amber-800">{healthError}</p>
            <p className="mt-2 font-mono text-xs text-amber-700">
              Configured endpoint: {getApiBaseUrl()}
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">API & D1 Database</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
              {health ? "Connected" : "Offline"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {health ? `API: ${health.status} · D1: ${health.database}` : "Run npm run pages:dev"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Active Notes</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{notes.length}</p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {verifiedCount} verified · {draftCount} drafts
              {unverifiedCount > 0 && (
                <>
                  {" · "}
                  <Link to="/documents?status=unverified" className="font-medium text-indigo-700 hover:underline">
                    {unverifiedCount} unverified
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Session Identity</p>
            <p className="mt-2 truncate text-2xl font-semibold text-slate-900">
              {user ? user.display_name : "Guest"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {user ? "Signed-in human session" : "Sign in to access workspace notes"}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Knowledge Notes</h2>
            <Link to="/documents" className="text-xs font-medium text-blue-700 hover:underline">
              Open Document Manager
            </Link>
          </div>

          {!user ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">
                Sign in or create a workspace to inspect and manage notes stored in Cloudflare D1.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800"
              >
                Sign in to Workspace
              </Link>
            </div>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">No notes stored yet in this workspace.</p>
              <Link
                to="/documents"
                className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800"
              >
                Create First Note
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notes.slice(0, 8).map((note) => (
                <div key={note.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <Link
                      to={`/documents?note=${encodeURIComponent(note.id)}`}
                      className="flex items-center gap-2 truncate text-sm font-medium text-slate-900 hover:text-blue-700"
                    >
                      <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums shrink-0">
                        {note.note_key}
                      </span>
                      <span className="truncate">{note.title}</span>
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {note.project} · {note.type} · <span className="font-mono tabular-nums">v{note.version}</span>
                      {note.tags && note.tags.length > 0 ? ` · ${note.tags.map((t) => `#${t}`).join(" ")}` : ""}
                    </p>
                  </div>
                  <StatusLabel status={note.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
