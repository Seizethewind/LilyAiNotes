import { Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { AssistantMessageList, type AssistantChatMessage } from "~/components/assistant/AssistantMessageList";
import { AppShell } from "~/components/layout/AppShell";
import { useSession } from "~/context/SessionContext";
import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import type { AssistantChatResponse, NoteRecord, TagFacet } from "~/types/api";

export default function AssistantRoute() {
  const { user, token } = useSession();
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [tagFacets, setTagFacets] = useState<TagFacet[]>([]);
  const [project, setProject] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiRequest<NoteRecord[]>("/notes", { token }),
      apiRequest<TagFacet[]>("/tags", { token }),
    ])
      .then(([noteRows, tags]) => {
        setNotes(noteRows);
        setTagFacets(tags);
      })
      .catch(() => {
        setNotes([]);
        setTagFacets([]);
      });
  }, [user, token]);

  const projects = useMemo(
    () => Array.from(new Set(notes.map((n) => n.project))).sort((a, b) => a.localeCompare(b)),
    [notes],
  );

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setError(null);
    const nextHistory = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(nextHistory);
    setPrompt("");
    setBusy(true);

    try {
      const res = await apiRequest<AssistantChatResponse>("/assistant/chat", {
        method: "POST",
        token,
        body: {
          message: trimmed,
          project: project || undefined,
          type: typeFilter || undefined,
          tag: tagFilter || undefined,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        },
      });
      setMessages([
        ...nextHistory,
        {
          role: "assistant",
          text: res.reply,
          scannedHeaders: res.scannedHeaders,
          selectedKeys: res.selectedKeys,
          citations: res.citations,
        },
      ]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Assistant request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Knowledge Assistant" breadcrumb="Header & ID Search">
      {!user ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Sign in from the sidebar to ask questions routed via classified note headers and ID keys.
        </div>
      ) : (
        <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Header-and-ID Note Assistant</h2>
              <p className="mt-1 text-xs text-slate-500">
                Scans classified note headers and ID keys first, then reads only selected D1 records.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Scope to classification type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                <option value="">All types</option>
                <option value="fact">Fact (FACT)</option>
                <option value="decision">Decision (DEC)</option>
                <option value="procedure">Procedure (PROC)</option>
                <option value="preference">Preference (PREF)</option>
                <option value="code">Code (CODE)</option>
                <option value="log">Log (LOG)</option>
                <option value="config">Config (CFG)</option>
              </select>
              <select
                aria-label="Scope to project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                aria-label="Scope to tag"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                <option value="">All tags</option>
                {tagFacets.map((t) => (
                  <option key={t.tag} value={t.tag}>#{t.tag}</option>
                ))}
              </select>
            </div>
          </div>

          <AssistantMessageList messages={messages} />

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-slate-200 pt-4">
            <input
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question grounded in your classified headers..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{busy ? "Scanning Headers..." : "Ask"}</span>
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
