import { useState } from "react";

import { MarkdownNoteViewer } from "~/components/documents/MarkdownNoteViewer";

interface NoteBodySectionProps {
  content: string;
}

export function NoteBodySection({ content }: NoteBodySectionProps) {
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">Note Content</span>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("rendered")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === "rendered" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rendered
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === "raw" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Raw Markdown
          </button>
        </div>
      </div>

      {viewMode === "rendered" ? (
        <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 bg-white p-4">
          <MarkdownNoteViewer content={content} />
        </div>
      ) : (
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800">
          {content}
        </pre>
      )}
    </div>
  );
}
