const SORT_COLUMN_MAP: Record<string, string> = {
  updated_at: "updated_at",
  created_at: "created_at",
  title: "title COLLATE NOCASE",
  note_key: "COALESCE(note_key, id) COLLATE NOCASE",
  version: "version",
  type: "type",
};

export function resolveNoteOrderBy(sortBy?: string | null, sortDir?: string | null): string {
  const col = SORT_COLUMN_MAP[sortBy || "updated_at"] || "updated_at";
  const dir = (sortDir || "").toLowerCase() === "asc" ? "ASC" : "DESC";
  return `${col} ${dir}, updated_at DESC`;
}
