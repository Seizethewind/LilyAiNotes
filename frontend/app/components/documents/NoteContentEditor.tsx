interface NoteContentEditorProps {
  isImportMode: boolean;
  content: string;
  byteLength: number;
  maxBytes: number;
  onChange: (value: string) => void;
}

export function NoteContentEditor(props: NoteContentEditorProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor="note-content" className="text-xs font-medium text-slate-700">
          {props.isImportMode ? "Converted Text Preview (Editable)" : "Content (UTF-8 / Markdown)"}
        </label>
        <span
          className={`font-mono text-xs tabular-nums ${
            props.byteLength > props.maxBytes ? "text-red-700" : "text-slate-500"
          }`}
        >
          {(props.byteLength / 1024).toFixed(1)} / {(props.maxBytes / 1024).toFixed(0)} KB
        </span>
      </div>
      <textarea
        id="note-content"
        required
        rows={7}
        value={props.content}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={
          props.isImportMode
            ? "Select a PDF, Markdown, JSON, or text document above to preview its converted text here..."
            : "# Heading\nWrite note contents here..."
        }
        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
      />
    </div>
  );
}
