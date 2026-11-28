export type TableAlignment = "left" | "center" | "right";

export interface MarkdownTableInput {
  headers: string[];
  rows: string[][];
  alignments?: TableAlignment[];
}

function sanitizeCell(raw: string): string {
  return raw.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

function alignmentDivider(align: TableAlignment, width: number): string {
  const dashCount = Math.max(3, width);
  if (align === "center") return `:${"-".repeat(Math.max(1, dashCount - 2))}:`;
  if (align === "right") return `${"-".repeat(Math.max(2, dashCount - 1))}:`;
  return `:${"-".repeat(Math.max(2, dashCount - 1))}`;
}

export function formatMarkdownTable({ headers, rows, alignments = [] }: MarkdownTableInput): string {
  const colCount = Math.max(1, headers.length);
  const cleanHeaders = Array.from({ length: colCount }, (_, idx) => {
    const cell = sanitizeCell(headers[idx] || "");
    return cell || `Column ${idx + 1}`;
  });
  const cleanRows = rows.map((row) =>
    Array.from({ length: colCount }, (_, idx) => sanitizeCell(row[idx] || "")),
  );

  const widths = cleanHeaders.map((header, colIdx) => {
    const maxBody = cleanRows.reduce((max, row) => Math.max(max, row[colIdx].length), 0);
    return Math.max(3, header.length, maxBody);
  });

  const formatRow = (cells: string[]) =>
    `| ${cells.map((cell, idx) => cell.padEnd(widths[idx], " ")).join(" | ")} |`;

  const dividerRow = `| ${widths
    .map((w, idx) => alignmentDivider(alignments[idx] || "left", w))
    .join(" | ")} |`;

  const lines = [formatRow(cleanHeaders), dividerRow, ...cleanRows.map(formatRow)];
  return lines.join("\n");
}
