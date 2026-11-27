interface CreateNoteModalHeaderProps {
  mode: "write" | "upload";
  onModeChange: (mode: "write" | "upload") => void;
}

export function CreateNoteModalHeader({ mode, onModeChange }: CreateNoteModalHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <h2 className="text-lg font-semibold text-slate-900">New Knowledge Note</h2>
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        {(["write", "upload"] as const).map((tabMode) => (
          <button
            key={tabMode}
            type="button"
            onClick={() => onModeChange(tabMode)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === tabMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tabMode === "write" ? "Write Note" : "Import Document"}
          </button>
        ))}
      </div>
    </div>
  );
}
