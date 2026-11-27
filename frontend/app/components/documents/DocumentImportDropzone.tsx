import { FileUp, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { DragEvent } from "react";

interface DocumentImportDropzoneProps {
  extracting: boolean;
  statusMessage: string | null;
  sourceName: string | null;
  sourceFormat: string | null;
  byteLength: number;
  maxBytes: number;
  canRetryWithAi: boolean;
  onSelectFile: (file: File) => void;
  onRetryWithAi: () => void;
}

export function DocumentImportDropzone(props: DocumentImportDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) props.onSelectFile(dropped);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="note-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-4 text-center transition-colors ${
          dragging ? "border-blue-700 bg-blue-50/50" : "border-slate-300 bg-slate-50/70 hover:border-slate-400"
        }`}
      >
        <FileUp className="mb-2 h-5 w-5 text-slate-500" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-800">
          {props.extracting ? "Converting document to text..." : "Drop a PDF, Markdown, JSON, or any UTF-8 text document"}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          Click to browse · Preview and edit extracted text before saving to D1
        </span>
        <input
          id="note-file"
          type="file"
          disabled={props.extracting}
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) props.onSelectFile(chosen);
          }}
          className="sr-only"
        />
      </label>

      {(props.sourceName || props.statusMessage) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            {props.sourceName && <span className="font-medium text-slate-800">{props.sourceName}</span>}
            {props.sourceFormat && (
              <>
                <span aria-hidden="true">·</span>
                <span>{props.sourceFormat}</span>
              </>
            )}
            {props.byteLength > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className={`font-mono tabular-nums ${props.byteLength > props.maxBytes ? "text-red-700" : "text-slate-600"}`}>
                  {(props.byteLength / 1024).toFixed(1)} / {(props.maxBytes / 1024).toFixed(0)} KB
                </span>
              </>
            )}
            {props.statusMessage && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700">{props.statusMessage}</span>
              </>
            )}
          </div>
          {props.canRetryWithAi && (
            <button
              type="button"
              disabled={props.extracting}
              onClick={props.onRetryWithAi}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              <span>Re-extract with AI</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
