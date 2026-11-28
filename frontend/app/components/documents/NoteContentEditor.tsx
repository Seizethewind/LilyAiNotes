import { Table } from "lucide-react";
import { useRef, useState } from "react";

import { MarkdownTableBuilder } from "~/components/documents/MarkdownTableBuilder";

interface NoteContentEditorProps {
  isImportMode: boolean;
  content: string;
  byteLength: number;
  maxBytes: number;
  onChange: (value: string) => void;
}

export function NoteContentEditor(props: NoteContentEditorProps) {
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function handleInsertTable(markdownTable: string) {
    const el = textareaRef.current;
    const start = el ? el.selectionStart : props.content.length;
    const end = el ? el.selectionEnd : props.content.length;
    const before = props.content.slice(0, start);
    const after = props.content.slice(end);
    const prefix = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const suffix = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
    props.onChange(`${before}${prefix}${markdownTable}${suffix}${after}`);
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="note-content" className="text-xs font-medium text-slate-700">
          {props.isImportMode ? "Converted Text Preview (Editable)" : "Content (UTF-8 / Markdown)"}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTableBuilder((open) => !open)}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Table className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            <span>{showTableBuilder ? "Hide Table Builder" : "Insert Table"}</span>
          </button>
          <span
            className={`font-mono text-xs tabular-nums ${
              props.byteLength > props.maxBytes ? "text-red-700" : "text-slate-500"
            }`}
          >
            {(props.byteLength / 1024).toFixed(1)} / {(props.maxBytes / 1024).toFixed(0)} KB
          </span>
        </div>
      </div>

      {showTableBuilder && (
        <MarkdownTableBuilder
          onInsert={handleInsertTable}
          onClose={() => setShowTableBuilder(false)}
        />
      )}

      <textarea
        ref={textareaRef}
        id="note-content"
        required
        rows={8}
        value={props.content}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={
          props.isImportMode
            ? "Select a PDF, Markdown, JSON, or text document above to preview its converted text here..."
            : "# Heading\nWrite note contents or insert a Markdown table above..."
        }
        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
      />
    </div>
  );
}
