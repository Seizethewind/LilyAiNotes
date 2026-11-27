import type { NoteVersionRecord } from "~/types/api";

export function VersionHistoryList({ versions }: { versions: NoteVersionRecord[] }) {
  return (
    <div className="border-t border-slate-200 pt-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Version History</h3>
      {versions.length === 0 ? (
        <p className="text-xs text-slate-500">No version history loaded.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-4 py-2 text-xs">
              <div className="min-w-0">
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  v{v.version}
                </span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-700">{v.change_note}</span>
              </div>
              <span className="shrink-0 font-mono text-slate-500 tabular-nums">
                {v.edited_by} · {new Date(v.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
