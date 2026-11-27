import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import { CreateNoteModalHeader } from "~/components/documents/CreateNoteModalHeader";
import { DocumentImportDropzone } from "~/components/documents/DocumentImportDropzone";
import { NoteContentEditor } from "~/components/documents/NoteContentEditor";
import { NoteLinkSelectors } from "~/components/documents/NoteLinkSelectors";
import { NoteMetadataFields } from "~/components/documents/NoteMetadataFields";
import { useDocumentImport } from "~/hooks/useDocumentImport";
import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import { requestClassification } from "~/services/api/requestClassification";
import type { NoteRecord, NoteScope, NoteType } from "~/types/api";
import { classifyTextLocally } from "~/utils/classifyTextLocally";

const MAX_NOTE_BYTES = 100 * 1024;

interface CreateNoteModalProps {
  token: string | null;
  existingNotes: NoteRecord[];
  availableTags: string[];
  onClose: () => void;
  onCreated: (note: NoteRecord) => void;
}

export function CreateNoteModal({ token, existingNotes, availableTags, onClose, onCreated }: CreateNoteModalProps) {
  const [mode, setMode] = useState<"write" | "upload">("write");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [project, setProject] = useState("general");
  const [type, setType] = useState<NoteType>("fact");
  const [scope, setScope] = useState<NoteScope>("project");
  const [tags, setTags] = useState<string[]>([]);
  const [parentId, setParentId] = useState("");
  const [supersedesId, setSupersedesId] = useState("");
  const [content, setContent] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docImport = useDocumentImport(
    token,
    ({ suggestedTitle, content: extractedContent }) => {
      const nextTitle = title.trim() ? title : suggestedTitle;
      if (!title.trim()) setTitle(suggestedTitle);
      setContent(extractedContent);
      const local = classifyTextLocally({ title: nextTitle, content: extractedContent, filename: docImport.sourceFile?.name });
      setType(local.type);
      if (!summary.trim()) setSummary(local.summary);
      if (tags.length === 0) setTags(local.tags);
    },
    setError,
  );

  const byteLength = useMemo(() => new TextEncoder().encode(content).byteLength, [content]);

  async function handleSuggestAi() {
    if (!content.trim()) return;
    setError(null);
    setClassifying(true);
    try {
      const suggestion = await requestClassification(
        { title, content, filename: docImport.sourceFile?.name, useAi: true },
        token,
      );
      setType(suggestion.type);
      if (suggestion.summary) setSummary(suggestion.summary);
      if (suggestion.tags.length > 0) setTags(suggestion.tags);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "AI classification failed.");
    } finally {
      setClassifying(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError(mode === "upload" ? "Select and convert a document before saving." : "Content is required.");
      return;
    }
    if (byteLength > MAX_NOTE_BYTES) {
      setError("Converted text exceeds the 100 KB note limit. Trim the preview text before saving.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const changeNote = docImport.sourceFile
        ? `Converted from ${docImport.sourceFile.name} (${docImport.sourceFormat || "text"})`
        : "Initial creation";
      const created = await apiRequest<NoteRecord>("/notes", {
        method: "POST",
        token,
        body: {
          title: title.trim() || docImport.sourceFile?.name.replace(/\.[^.]+$/, "") || "Untitled",
          summary,
          project: project.trim() || "general",
          type,
          tags,
          scope,
          parent_id: parentId || null,
          supersedes_id: supersedesId || null,
          content,
          change_note: changeNote,
        },
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6">
        <CreateNoteModalHeader mode={mode} onModeChange={setMode} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "upload" && (
            <DocumentImportDropzone
              extracting={docImport.extracting}
              statusMessage={docImport.statusMessage}
              sourceName={docImport.sourceFile?.name || null}
              sourceFormat={docImport.sourceFormat}
              byteLength={byteLength}
              maxBytes={MAX_NOTE_BYTES}
              canRetryWithAi={docImport.isPdfSource && !docImport.usedAiFallback}
              onSelectFile={(f) => void docImport.selectFile(f)}
              onRetryWithAi={() => void docImport.retryWithAi()}
            />
          )}

          <NoteMetadataFields
            title={title}
            project={project}
            type={type}
            scope={scope}
            summary={summary}
            tags={tags}
            availableTags={availableTags}
            titleOptional={false}
            classifying={classifying}
            canSuggestAi={Boolean(content.trim())}
            onTitleChange={setTitle}
            onProjectChange={setProject}
            onTypeChange={setType}
            onScopeChange={setScope}
            onSummaryChange={setSummary}
            onTagsChange={setTags}
            onSuggestAi={() => void handleSuggestAi()}
          />

          <NoteLinkSelectors
            existingNotes={existingNotes}
            parentId={parentId}
            supersedesId={supersedesId}
            onParentChange={setParentId}
            onSupersedesChange={setSupersedesId}
          />

          <NoteContentEditor
            isImportMode={mode === "upload"}
            content={content}
            byteLength={byteLength}
            maxBytes={MAX_NOTE_BYTES}
            onChange={setContent}
          />

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || docImport.extracting}
              className="min-h-[40px] rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
