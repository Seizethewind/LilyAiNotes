import type { FormEvent } from "react";

import { TagInputField } from "~/components/documents/TagInputField";
import type { NoteType } from "~/types/api";

interface NoteEditFormProps {
  title: string;
  summary: string;
  type: NoteType;
  tags: string[];
  availableTags: string[];
  content: string;
  changeNote: string;
  busy: boolean;
  onTitleChange: (v: string) => void;
  onSummaryChange: (v: string) => void;
  onTypeChange: (v: NoteType) => void;
  onTagsChange: (tags: string[]) => void;
  onContentChange: (v: string) => void;
  onChangeNoteChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function NoteEditForm(props: NoteEditFormProps) {
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          value={props.title}
          onChange={(e) => props.onTitleChange(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium"
        />
        <select
          aria-label="Classification type"
          value={props.type}
          onChange={(e) => props.onTypeChange(e.target.value as NoteType)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="fact">Fact (FACT)</option>
          <option value="decision">Decision (DEC)</option>
          <option value="procedure">Procedure (PROC)</option>
          <option value="preference">Preference (PREF)</option>
          <option value="code">Code (CODE)</option>
          <option value="log">Log (LOG)</option>
          <option value="config">Config (CFG)</option>
        </select>
      </div>
      <input
        value={props.summary}
        onChange={(e) => props.onSummaryChange(e.target.value)}
        placeholder="Header Summary"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <TagInputField tags={props.tags} suggestions={props.availableTags} onChange={props.onTagsChange} />
      <textarea
        required
        rows={8}
        value={props.content}
        onChange={(e) => props.onContentChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
      />
      <input
        required
        value={props.changeNote}
        onChange={(e) => props.onChangeNoteChange(e.target.value)}
        placeholder="Reason for this change (required)"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={props.busy}
        className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {props.busy ? "Saving Version..." : "Save New Version"}
      </button>
    </form>
  );
}
