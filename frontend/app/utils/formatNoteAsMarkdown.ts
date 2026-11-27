import type { NoteRecord } from "~/types/api";

export function formatNoteAsMarkdown(note: NoteRecord): string {
  const lines = [
    `# ${note.title}`,
    "",
    `- Key: ${note.note_key}`,
    `- Project: ${note.project}`,
    `- Type: ${note.type}`,
    `- Status: ${note.status}`,
    `- Version: v${note.version}`,
    `- Updated: ${note.updated_at}`,
  ];
  if (note.tags.length > 0) {
    lines.push(`- Tags: ${note.tags.join(", ")}`);
  }
  if (note.summary) {
    lines.push(`- Summary: ${note.summary}`);
  }
  lines.push("", "---", "", note.content, "");
  return lines.join("\n");
}
