import { TagInputField } from "~/components/documents/TagInputField";
import type { NoteScope, NoteType } from "~/types/api";

interface NoteMetadataFieldsProps {
  title: string;
  project: string;
  type: NoteType;
  scope: NoteScope;
  summary: string;
  tags: string[];
  availableTags: string[];
  titleOptional: boolean;
  classifying?: boolean;
  canSuggestAi?: boolean;
  onTitleChange: (v: string) => void;
  onProjectChange: (v: string) => void;
  onTypeChange: (v: NoteType) => void;
  onScopeChange: (v: NoteScope) => void;
  onSummaryChange: (v: string) => void;
  onTagsChange: (tags: string[]) => void;
  onSuggestAi?: () => void;
}

export function NoteMetadataFields(props: NoteMetadataFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="note-title" className="mb-1 block text-xs font-medium text-slate-700">
            Title {props.titleOptional ? "(optional)" : ""}
          </label>
          <input
            id="note-title"
            required={!props.titleOptional}
            value={props.title}
            onChange={(e) => props.onTitleChange(e.target.value)}
            placeholder="D1 Backup Policy"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="note-project" className="mb-1 block text-xs font-medium text-slate-700">
            Project
          </label>
          <input
            id="note-project"
            value={props.project}
            onChange={(e) => props.onProjectChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label htmlFor="note-type" className="text-xs font-medium text-slate-700">
              Classification Type
            </label>
            {props.onSuggestAi && (
              <button
                type="button"
                disabled={!props.canSuggestAi || props.classifying}
                onClick={props.onSuggestAi}
                className="text-xs font-medium text-blue-700 hover:underline disabled:opacity-40 whitespace-nowrap"
              >
                {props.classifying ? "Classifying..." : "Suggest with AI"}
              </button>
            )}
          </div>
          <select
            id="note-type"
            value={props.type}
            onChange={(e) => props.onTypeChange(e.target.value as NoteType)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
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
        <div>
          <label htmlFor="note-scope" className="mb-1 block text-xs font-medium text-slate-700">
            Scope
          </label>
          <select
            id="note-scope"
            value={props.scope}
            onChange={(e) => props.onScopeChange(e.target.value as NoteScope)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
          >
            <option value="project">Project</option>
            <option value="global">Global</option>
            <option value="agent">Agent</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="note-summary" className="mb-1 block text-xs font-medium text-slate-700">
          Header Summary (searched by AI index)
        </label>
        <input
          id="note-summary"
          value={props.summary}
          onChange={(e) => props.onSummaryChange(e.target.value)}
          placeholder="One-line header summary for fast search & ID lookup"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
        />
      </div>

      <TagInputField tags={props.tags} suggestions={props.availableTags} onChange={props.onTagsChange} />
    </>
  );
}
