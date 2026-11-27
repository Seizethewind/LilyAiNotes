import { X } from "lucide-react";
import { useState } from "react";
import type { KeyboardEvent } from "react";

interface TagInputFieldProps {
  tags: string[];
  suggestions: string[];
  onChange: (nextTags: string[]) => void;
}

export function TagInputField({ tags, suggestions, onChange }: TagInputFieldProps) {
  const [draft, setDraft] = useState("");

  function addNormalizedTag(raw: string) {
    const slug = raw
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);
    if (!slug || tags.includes(slug) || tags.length >= 5) {
      setDraft("");
      return;
    }
    onChange([...tags, slug]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addNormalizedTag(draft);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor="note-tags-input" className="text-xs font-medium text-slate-700">
          Tags (up to 5, normalized)
        </label>
        <span className="font-mono text-xs text-slate-500 tabular-nums">{tags.length}/5</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            <span>#{tag}</span>
            <X className="h-3 w-3 text-slate-500" aria-hidden="true" />
          </button>
        ))}
        <input
          id="note-tags-input"
          list="workspace-tag-suggestions"
          value={draft}
          disabled={tags.length >= 5}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length >= 5 ? "Max 5 tags" : "Add tag (e.g. cloudflare-d1)..."}
          className="min-w-[160px] flex-1 text-xs text-slate-900 focus:outline-none disabled:bg-transparent"
        />
        {draft.trim() && (
          <button
            type="button"
            onClick={() => addNormalizedTag(draft)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Add
          </button>
        )}
      </div>
      <datalist id="workspace-tag-suggestions">
        {suggestions
          .filter((s) => !tags.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
