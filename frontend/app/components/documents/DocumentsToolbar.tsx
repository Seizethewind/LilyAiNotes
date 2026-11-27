import { Download, Search } from "lucide-react";

import type { TagFacet } from "~/types/api";

export type FilterTab = "all" | "verified" | "draft" | "disputed" | "trash";

interface DocumentsToolbarProps {
  tab: FilterTab;
  typeFilter: string;
  projectFilter: string;
  scopeFilter: string;
  tagFilter: string;
  sortValue: string;
  projects: string[];
  tagFacets: TagFacet[];
  query: string;
  showEmptyTrash: boolean;
  hasActiveFilters: boolean;
  onSelectTab: (tab: FilterTab) => void;
  onTypeChange: (type: string) => void;
  onProjectChange: (project: string) => void;
  onScopeChange: (scope: string) => void;
  onTagChange: (tag: string) => void;
  onSortChange: (sort: string) => void;
  onQueryChange: (q: string) => void;
  onClearFilters: () => void;
  onEmptyTrash: () => void;
  onExport: (format: "markdown" | "json") => void;
}

export function DocumentsToolbar(props: DocumentsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(["all", "verified", "draft", "disputed", "trash"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => props.onSelectTab(item)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                props.tab === item ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {props.showEmptyTrash && (
            <button
              type="button"
              onClick={props.onEmptyTrash}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
            >
              Empty Trash
            </button>
          )}
          <button
            type="button"
            onClick={() => props.onExport("markdown")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export .md</span>
          </button>
          <button
            type="button"
            onClick={() => props.onExport("json")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Export .json
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={props.query}
              onChange={(e) => props.onQueryChange(e.target.value)}
              placeholder="Search ID key, title, tags..."
              className="w-60 rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by type"
          value={props.typeFilter}
          onChange={(e) => props.onTypeChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          <option value="">All types</option>
          <option value="fact">Fact (FACT)</option>
          <option value="decision">Decision (DEC)</option>
          <option value="procedure">Procedure (PROC)</option>
          <option value="preference">Preference (PREF)</option>
          <option value="code">Code (CODE)</option>
          <option value="log">Log (LOG)</option>
          <option value="config">Config (CFG)</option>
        </select>

        <select
          aria-label="Filter by project"
          value={props.projectFilter}
          onChange={(e) => props.onProjectChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          <option value="">All projects</option>
          {props.projects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          aria-label="Filter by scope"
          value={props.scopeFilter}
          onChange={(e) => props.onScopeChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          <option value="">All scopes</option>
          <option value="project">Project</option>
          <option value="global">Global</option>
          <option value="agent">Agent</option>
          <option value="private">Private</option>
        </select>

        <select
          aria-label="Filter by tag"
          value={props.tagFilter}
          onChange={(e) => props.onTagChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          <option value="">All tags</option>
          {props.tagFacets.map((t) => (
            <option key={t.tag} value={t.tag}>
              #{t.tag} ({t.count})
            </option>
          ))}
        </select>

        <select
          aria-label="Sort notes"
          value={props.sortValue}
          onChange={(e) => props.onSortChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          <option value="updated_at:desc">Sort: Updated (Newest)</option>
          <option value="updated_at:asc">Sort: Updated (Oldest)</option>
          <option value="note_key:asc">Sort: ID Key (A–Z)</option>
          <option value="title:asc">Sort: Title (A–Z)</option>
          <option value="version:desc">Sort: Version (Highest)</option>
        </select>

        {props.hasActiveFilters && (
          <button
            type="button"
            onClick={props.onClearFilters}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
