import { Search } from "lucide-react";

import type { EndpointDocItem, HttpMethod } from "~/types/docs";

interface EndpointCatalogSidebarProps {
  endpoints: EndpointDocItem[];
  groups: string[];
  selectedId: string;
  query: string;
  groupFilter: string;
  onQueryChange: (q: string) => void;
  onGroupChange: (g: string) => void;
  onSelect: (id: string) => void;
  onResetFilters: () => void;
}

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "text-emerald-700",
  POST: "text-blue-700",
  PATCH: "text-amber-700",
  DELETE: "text-red-700",
};

export function EndpointCatalogSidebar({
  endpoints,
  groups,
  selectedId,
  query,
  groupFilter,
  onQueryChange,
  onGroupChange,
  onSelect,
  onResetFilters,
}: EndpointCatalogSidebarProps) {
  const visibleGroups = Array.from(new Set(endpoints.map((ep) => ep.group)));

  return (
    <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            aria-label="Filter endpoints"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter by path or title..."
            className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter by domain group"
          value={groupFilter}
          onChange={(e) => onGroupChange(e.target.value)}
          className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
        >
          <option value="">All endpoint groups ({endpoints.length})</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      {endpoints.length === 0 ? (
        <div className="space-y-3 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>No endpoints match "{query}".</p>
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-[36px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="max-h-[40rem] space-y-4 overflow-y-auto border-t border-slate-200 pt-3">
          {visibleGroups.map((groupName) => (
            <div key={groupName} className="space-y-1">
              <p className="px-2 text-xs font-semibold text-slate-500">{groupName}</p>
              {endpoints
                .filter((ep) => ep.group === groupName)
                .map((ep) => {
                  const active = ep.id === selectedId;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => onSelect(ep.id)}
                      className={`flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        active ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-12 shrink-0 font-mono font-semibold ${METHOD_COLOR[ep.method]}`}>
                          {ep.method}
                        </span>
                        <span className="truncate font-mono text-slate-900">{ep.path}</span>
                      </div>
                      <span className="truncate pl-14 text-xs text-slate-500">{ep.title}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
