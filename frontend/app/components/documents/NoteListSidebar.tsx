import { StatusLabel } from "~/components/documents/StatusLabel";
import type { NoteRecord, NoteSearchItem } from "~/types/api";

interface NoteListSidebarProps {
  loading: boolean;
  isTrash: boolean;
  notes: NoteRecord[];
  searchResults: NoteSearchItem[] | null;
  selectedId: string | null;
  onSelectNote: (note: NoteRecord) => void;
  onSelectSearchId: (id: string) => void;
}

export function NoteListSidebar({
  loading,
  isTrash,
  notes,
  searchResults,
  selectedId,
  onSelectNote,
  onSelectSearchId,
}: NoteListSidebarProps) {
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {loading ? (
        <div className="p-6 text-xs text-slate-500">Loading notes...</div>
      ) : searchResults ? (
        searchResults.length === 0 ? (
          <div className="p-6 text-xs text-slate-500">No matching notes found.</div>
        ) : (
          searchResults.map((hit) => (
            <button
              key={hit.id}
              type="button"
              onClick={() => onSelectSearchId(hit.id)}
              className="block w-full px-5 py-4 text-left hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums shrink-0">
                    {hit.note_key}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-900">{hit.title}</span>
                </div>
                <StatusLabel status={hit.status} />
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600">{hit.snippet}</p>
              <p className="mt-1.5 truncate font-mono text-[11px] text-slate-400">
                {hit.type} · {hit.project}
                {hit.tags.length > 0 ? ` · ${hit.tags.map((t) => `#${t}`).join(" ")}` : ""}
              </p>
            </button>
          ))
        )
      ) : notes.length === 0 ? (
        <div className="p-6 text-xs text-slate-500">
          {isTrash ? "Trash is empty." : "No notes match these filters."}
        </div>
      ) : (
        notes.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onSelectNote(n)}
            className={`block w-full px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
              selectedId === n.id ? "bg-slate-50" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums shrink-0">
                  {n.note_key}
                </span>
                <span className="truncate text-sm font-medium text-slate-900">{n.title}</span>
              </div>
              <StatusLabel status={n.status} />
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">
              {n.project} · {n.type} · <span className="font-mono tabular-nums">v{n.version}</span>
              {n.tags.length > 0 ? ` · ${n.tags.map((t) => `#${t}`).join(" ")}` : ""}
            </p>
          </button>
        ))
      )}
    </div>
  );
}
