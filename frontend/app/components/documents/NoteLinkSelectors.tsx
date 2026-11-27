import type { NoteRecord } from "~/types/api";

interface NoteLinkSelectorsProps {
  existingNotes: NoteRecord[];
  parentId: string;
  supersedesId: string;
  onParentChange: (v: string) => void;
  onSupersedesChange: (v: string) => void;
}

export function NoteLinkSelectors({
  existingNotes,
  parentId,
  supersedesId,
  onParentChange,
  onSupersedesChange,
}: NoteLinkSelectorsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="note-parent" className="mb-1 block text-xs font-medium text-slate-700">
          Parent Topic (optional)
        </label>
        <select
          id="note-parent"
          value={parentId}
          onChange={(e) => onParentChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="">None</option>
          {existingNotes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.project}: {n.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note-supersedes" className="mb-1 block text-xs font-medium text-slate-700">
          Replaces / Supersedes (optional)
        </label>
        <select
          id="note-supersedes"
          value={supersedesId}
          onChange={(e) => onSupersedesChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="">None</option>
          {existingNotes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title} (v{n.version})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
