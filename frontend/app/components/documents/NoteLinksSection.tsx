import { useEffect, useState } from "react";

import { StatusLabel } from "~/components/documents/StatusLabel";
import { apiRequest } from "~/services/api/apiClient";
import type { NoteLinkSummary, NoteLinksResponse } from "~/types/api";

interface NoteLinksSectionProps {
  noteId: string;
  token: string | null;
  onSelectNoteId: (id: string) => void;
}

function LinkPillRow({
  label,
  items,
  onSelectNoteId,
}: {
  label: string;
  items: NoteLinkSummary[];
  onSelectNoteId: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectNoteId(item.id)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs hover:bg-slate-50"
          >
            <span className="truncate font-medium text-slate-900">{item.title}</span>
            <span className="flex items-center gap-2 shrink-0">
              <StatusLabel status={item.status} />
              <span className="font-mono text-slate-400 tabular-nums">v{item.version}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function NoteLinksSection({ noteId, token, onSelectNoteId }: NoteLinksSectionProps) {
  const [links, setLinks] = useState<NoteLinksResponse | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<NoteLinksResponse>(`/notes/${noteId}/links`, { token })
      .then((res) => {
        if (active) setLinks(res);
      })
      .catch(() => {
        if (active) setLinks(null);
      });
    return () => {
      active = false;
    };
  }, [noteId, token]);

  if (!links) return null;
  const hasAny =
    Boolean(links.parent) ||
    Boolean(links.supersedes) ||
    links.superseded_by.length > 0 ||
    links.children.length > 0;
  if (!hasAny) return null;

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-xs font-semibold text-slate-700">Topic & Replacement Links</h3>
      <LinkPillRow
        label="Parent Topic"
        items={links.parent ? [links.parent] : []}
        onSelectNoteId={onSelectNoteId}
      />
      <LinkPillRow
        label="Supersedes"
        items={links.supersedes ? [links.supersedes] : []}
        onSelectNoteId={onSelectNoteId}
      />
      <LinkPillRow label="Superseded By" items={links.superseded_by} onSelectNoteId={onSelectNoteId} />
      <LinkPillRow label="Child Notes" items={links.children} onSelectNoteId={onSelectNoteId} />
    </div>
  );
}
