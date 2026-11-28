import { useCallback, useEffect, useMemo, useState } from "react";

import type { FilterTab } from "~/components/documents/DocumentsToolbar";
import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import type { NoteRecord, NoteSearchItem, TagFacet } from "~/types/api";

const VALID_TABS = new Set<FilterTab>(["all", "unverified", "verified", "draft", "disputed", "trash"]);

export function useDocumentsWorkspace(
  userPresent: boolean,
  token: string | null,
  initialNoteId: string | null,
  initialStatus?: string | null,
) {
  const defaultTab: FilterTab = initialStatus && VALID_TABS.has(initialStatus as FilterTab)
    ? (initialStatus as FilterTab)
    : "all";
  const [tab, setTab] = useState<FilterTab>(defaultTab);
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortValue, setSortValue] = useState("updated_at:desc");
  const [query, setQuery] = useState("");
  const [allNotes, setAllNotes] = useState<NoteRecord[]>([]);
  const [tagFacets, setTagFacets] = useState<TagFacet[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [searchResults, setSearchResults] = useState<NoteSearchItem[] | null>(null);
  const [selected, setSelected] = useState<NoteRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projects = useMemo(
    () => Array.from(new Set(allNotes.map((n) => n.project))).sort((a, b) => a.localeCompare(b)),
    [allNotes],
  );
  const availableTags = useMemo(() => tagFacets.map((t) => t.tag), [tagFacets]);

  const loadNotes = useCallback(async () => {
    if (!userPresent) return;
    setLoading(true);
    setError(null);
    const [sortBy, sortDir] = sortValue.split(":");
    try {
      const [workspaceNotes, tags] = await Promise.all([
        apiRequest<NoteRecord[]>("/notes", { token }),
        apiRequest<TagFacet[]>("/tags", { token }),
      ]);
      setAllNotes(workspaceNotes);
      setTagFacets(tags);

      if (tab === "trash") {
        setNotes(await apiRequest<NoteRecord[]>("/notes-trash", { token }));
        setSearchResults(null);
        return;
      }
      const params = new URLSearchParams({ sort_by: sortBy, sort_dir: sortDir });
      if (tab !== "all") params.set("status", tab);
      if (typeFilter) params.set("type", typeFilter);
      if (projectFilter) params.set("project", projectFilter);
      if (scopeFilter) params.set("scope", scopeFilter);
      if (tagFilter) params.set("tag", tagFilter);

      if (query.trim()) {
        params.set("q", query.trim());
        setSearchResults(await apiRequest<NoteSearchItem[]>(`/notes/search?${params.toString()}`, { token }));
      } else {
        setNotes(await apiRequest<NoteRecord[]>(`/notes?${params.toString()}`, { token }));
        setSearchResults(null);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [userPresent, token, tab, typeFilter, projectFilter, scopeFilter, tagFilter, sortValue, query]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const selectById = useCallback(
    async (id: string) => {
      try {
        setSelected(await apiRequest<NoteRecord>(`/notes/${id}`, { token }));
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Unable to load note.");
      }
    },
    [token],
  );

  useEffect(() => {
    if (userPresent && initialNoteId) void selectById(initialNoteId);
  }, [userPresent, initialNoteId, selectById]);

  function clearFilters() {
    setTypeFilter("");
    setProjectFilter("");
    setScopeFilter("");
    setTagFilter("");
    setQuery("");
    setSortValue("updated_at:desc");
    if (tab !== "all") setTab("all");
  }

  return {
    tab, setTab, typeFilter, setTypeFilter, projectFilter, setProjectFilter,
    scopeFilter, setScopeFilter, tagFilter, setTagFilter, sortValue, setSortValue,
    query, setQuery, allNotes, tagFacets, projects, availableTags, notes,
    searchResults, selected, setSelected, loading, error, setError,
    loadNotes, selectById, clearFilters,
  };
}
