import { useSearchParams } from "@remix-run/react";
import { Plus } from "lucide-react";
import { useState } from "react";

import { CreateNoteModal } from "~/components/documents/CreateNoteModal";
import { DocumentsToolbar } from "~/components/documents/DocumentsToolbar";
import { NoteDetailPanel } from "~/components/documents/NoteDetailPanel";
import { NoteListSidebar } from "~/components/documents/NoteListSidebar";
import { AppShell } from "~/components/layout/AppShell";
import { useSession } from "~/context/SessionContext";
import { useDocumentsWorkspace } from "~/hooks/useDocumentsWorkspace";
import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import { downloadWorkspaceExport } from "~/services/api/downloadWorkspaceExport";

export default function DocumentsRoute() {
  const { user, token } = useSession();
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const ws = useDocumentsWorkspace(
    Boolean(user),
    token,
    searchParams.get("note"),
    searchParams.get("status"),
  );

  return (
    <AppShell
      title="Document Manager"
      breadcrumb="Workspace"
      primaryAction={
        user ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Note</span>
          </button>
        ) : undefined
      }
    >
      {!user ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Sign in from the sidebar to create, classify, search, filter, and version text documents.
        </div>
      ) : (
        <div className="space-y-6">
          <DocumentsToolbar
            tab={ws.tab}
            typeFilter={ws.typeFilter}
            projectFilter={ws.projectFilter}
            scopeFilter={ws.scopeFilter}
            tagFilter={ws.tagFilter}
            sortValue={ws.sortValue}
            projects={ws.projects}
            tagFacets={ws.tagFacets}
            query={ws.query}
            showEmptyTrash={ws.tab === "trash" && ws.notes.length > 0}
            hasActiveFilters={Boolean(
              ws.typeFilter || ws.projectFilter || ws.scopeFilter || ws.tagFilter || ws.query || ws.tab !== "all",
            )}
            onSelectTab={(item) => {
              ws.setSelected(null);
              ws.setTab(item);
            }}
            onTypeChange={ws.setTypeFilter}
            onProjectChange={ws.setProjectFilter}
            onScopeChange={ws.setScopeFilter}
            onTagChange={ws.setTagFilter}
            onSortChange={ws.setSortValue}
            onQueryChange={ws.setQuery}
            onClearFilters={ws.clearFilters}
            onEmptyTrash={() =>
              void apiRequest("/notes-trash", { method: "DELETE", token }).then(() => {
                ws.setSelected(null);
                void ws.loadNotes();
              })
            }
            onExport={(format) =>
              void downloadWorkspaceExport({
                format,
                project: ws.projectFilter || undefined,
                token,
              }).catch((err) => ws.setError(err instanceof ApiClientError ? err.message : "Unable to export notes."))
            }
          />

          {ws.error && <p className="text-sm font-medium text-red-700">{ws.error}</p>}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <NoteListSidebar
                loading={ws.loading}
                isTrash={ws.tab === "trash"}
                notes={ws.notes}
                searchResults={ws.searchResults}
                selectedId={ws.selected?.id || null}
                onSelectNote={ws.setSelected}
                onSelectSearchId={(id) => void ws.selectById(id)}
              />
            </div>
            <div className="lg:col-span-7">
              {ws.selected ? (
                <NoteDetailPanel
                  note={ws.selected}
                  token={token}
                  availableTags={ws.availableTags}
                  onUpdated={(updated) => {
                    ws.setSelected(updated);
                    void ws.loadNotes();
                  }}
                  onDeleted={() => {
                    ws.setSelected(null);
                    void ws.loadNotes();
                  }}
                  onRestored={() => {
                    ws.setSelected(null);
                    void ws.loadNotes();
                  }}
                  onSelectNoteId={(id) => void ws.selectById(id)}
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  Select a note from the list to inspect its ID key, classification, tags, links, or version history.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateNoteModal
          token={token}
          existingNotes={ws.allNotes}
          availableTags={ws.availableTags}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            ws.setSelected(created);
            void ws.loadNotes();
          }}
        />
      )}
    </AppShell>
  );
}
