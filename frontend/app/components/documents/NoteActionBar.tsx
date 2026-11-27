import type { NoteRecord } from "~/types/api";
import { downloadTextFile } from "~/utils/downloadTextFile";
import { formatNoteAsMarkdown } from "~/utils/formatNoteAsMarkdown";

interface NoteActionBarProps {
  note: NoteRecord;
  busy: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onVerify: (status: "verified" | "disputed") => void;
  onFlag: () => void;
  onTrash: () => void;
  onRestore: () => void;
}

export function NoteActionBar(props: NoteActionBarProps) {
  const { note, busy, editing } = props;
  const safeBase = note.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "note";

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {note.deleted_at ? (
        <button
          type="button"
          disabled={busy}
          onClick={props.onRestore}
          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap"
        >
          Restore Note
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={props.onToggleEdit}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            {editing ? "Cancel Edit" : "Edit"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => props.onVerify("verified")}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
          >
            Verify
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => props.onVerify("disputed")}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 whitespace-nowrap"
          >
            Dispute
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={props.onFlag}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Flag
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              downloadTextFile(`${safeBase}.md`, formatNoteAsMarkdown(note), "text/markdown;charset=utf-8")
            }
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Export .md
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              downloadTextFile(`${safeBase}.json`, JSON.stringify(note, null, 2), "application/json;charset=utf-8")
            }
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Export .json
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={props.onTrash}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
          >
            Trash
          </button>
        </>
      )}
    </div>
  );
}
