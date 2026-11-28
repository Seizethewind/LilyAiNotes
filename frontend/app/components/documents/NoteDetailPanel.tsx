import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { NoteActionBar } from "~/components/documents/NoteActionBar";
import { NoteBodySection } from "~/components/documents/NoteBodySection";
import { NoteEditForm } from "~/components/documents/NoteEditForm";
import { NoteLinksSection } from "~/components/documents/NoteLinksSection";
import { StatusLabel } from "~/components/documents/StatusLabel";
import { VersionHistoryList } from "~/components/documents/VersionHistoryList";
import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import type { NoteRecord, NoteType, NoteVersionRecord } from "~/types/api";

interface NoteDetailPanelProps {
  note: NoteRecord;
  token: string | null;
  availableTags: string[];
  onUpdated: (note: NoteRecord) => void;
  onDeleted: (noteId: string) => void;
  onRestored: (noteId: string) => void;
  onSelectNoteId: (noteId: string) => void;
}

export function NoteDetailPanel({
  note,
  token,
  availableTags,
  onUpdated,
  onDeleted,
  onRestored,
  onSelectNoteId,
}: NoteDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [summary, setSummary] = useState(note.summary);
  const [type, setType] = useState<NoteType>(note.type);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [content, setContent] = useState(note.content);
  const [changeNote, setChangeNote] = useState("");
  const [versions, setVersions] = useState<NoteVersionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setSummary(note.summary);
    setType(note.type);
    setTags(note.tags || []);
    setContent(note.content);
    setChangeNote("");
    setEditing(false);
    setError(null);
    apiRequest<NoteVersionRecord[]>(`/notes/${note.id}/versions`, { token })
      .then(setVersions)
      .catch(() => setVersions([]));
  }, [note, token]);

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await apiRequest<NoteRecord>(`/notes/${note.id}`, {
        method: "PATCH",
        token,
        body: { title, summary, type, tags, content, change_note: changeNote },
      });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save version.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-semibold text-blue-700 tabular-nums">{note.note_key}</span>
            <span aria-hidden="true">·</span>
            <StatusLabel status={note.status} />
            <span aria-hidden="true">·</span>
            <span>{note.project}</span>
            <span aria-hidden="true">·</span>
            <span>{note.type}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">v{note.version}</span>
            <span aria-hidden="true">·</span>
            <span>By {note.author}</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{note.title}</h2>
          {note.summary && <p className="text-sm text-slate-600">{note.summary}</p>}
          {note.tags && note.tags.length > 0 && (
            <p className="font-mono text-xs text-slate-500">{note.tags.map((t) => `#${t}`).join(" · ")}</p>
          )}
        </div>

        <NoteActionBar
          note={note}
          busy={busy}
          editing={editing}
          onToggleEdit={() => setEditing(!editing)}
          onVerify={(status) =>
            void runAction(async () => {
              onUpdated(
                await apiRequest<NoteRecord>(`/notes/${note.id}/verify`, {
                  method: "POST",
                  token,
                  body: { status },
                }),
              );
            })
          }
          onFlag={() =>
            void runAction(async () => {
              onUpdated(
                await apiRequest<NoteRecord>(`/notes/${note.id}/flag`, {
                  method: "POST",
                  token,
                  body: { reason: "Flagged for review in UI" },
                }),
              );
            })
          }
          onTrash={() =>
            void runAction(async () => {
              await apiRequest(`/notes/${note.id}`, { method: "DELETE", token });
              onDeleted(note.id);
            })
          }
          onRestore={() =>
            void runAction(async () => {
              await apiRequest(`/notes/${note.id}/restore`, { method: "POST", token });
              onRestored(note.id);
            })
          }
        />
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      {editing ? (
        <NoteEditForm
          title={title}
          summary={summary}
          type={type}
          tags={tags}
          availableTags={availableTags}
          content={content}
          changeNote={changeNote}
          busy={busy}
          onTitleChange={setTitle}
          onSummaryChange={setSummary}
          onTypeChange={setType}
          onTagsChange={setTags}
          onContentChange={setContent}
          onChangeNoteChange={setChangeNote}
          onSubmit={(e) => void handleSaveEdit(e)}
        />
      ) : (
        <NoteBodySection content={note.content} />
      )}

      {!note.deleted_at && (
        <NoteLinksSection noteId={note.id} token={token} onSelectNoteId={onSelectNoteId} />
      )}
      <VersionHistoryList versions={versions} />
    </div>
  );
}
