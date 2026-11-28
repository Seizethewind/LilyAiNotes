import type { ReactNode } from "react";

import type { TableAlignment } from "~/utils/formatMarkdownTable";
import { parseInlineMarkdown } from "~/utils/parseInlineMarkdown";
import { parseMarkdownBlocks } from "~/utils/parseMarkdownBlocks";

interface MarkdownNoteViewerProps {
  content: string;
}

function renderInline(text: string): ReactNode[] {
  return parseInlineMarkdown(text).map((token, idx) => {
    if (token.type === "code") {
      return (
        <code key={idx} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-900">
          {token.value}
        </code>
      );
    }
    if (token.type === "bold") return <strong key={idx} className="font-semibold text-slate-900">{token.value}</strong>;
    if (token.type === "italic") return <em key={idx}>{token.value}</em>;
    if (token.type === "link") {
      return (
        <a
          key={idx}
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
        >
          {token.label}
        </a>
      );
    }
    return <span key={idx}>{token.value}</span>;
  });
}

function alignmentClass(align: TableAlignment): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function isNumericCell(value: string): boolean {
  return /^-?[$€£]?\d[\d,.]*%?$/.test(value.trim());
}

export function MarkdownNoteViewer({ content }: MarkdownNoteViewerProps) {
  const blocks = parseMarkdownBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-sm text-slate-500">This note has no content yet.</p>;
  }

  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-800">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const sizes = {
            1: "text-lg font-bold text-slate-900",
            2: "text-base font-semibold text-slate-900",
            3: "text-sm font-semibold text-slate-900",
            4: "text-sm font-medium text-slate-800",
          };
          const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4";
          return (
            <Tag key={idx} className={sizes[block.level]}>
              {renderInline(block.text)}
            </Tag>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={idx}
              className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs leading-relaxed text-slate-100"
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.type === "table") {
          return (
            <div key={idx} className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {block.headers.map((header, colIdx) => (
                      <th
                        key={colIdx}
                        className={`h-10 px-3 font-semibold text-slate-900 ${alignmentClass(block.alignments[colIdx] || "left")}`}
                      >
                        {renderInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {block.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50/70">
                      {row.map((cell, colIdx) => {
                        const align = block.alignments[colIdx] || "left";
                        const numeric = isNumericCell(cell);
                        return (
                          <td
                            key={colIdx}
                            className={`min-h-[40px] px-3 py-2.5 text-slate-700 ${alignmentClass(align)} ${
                              numeric ? "font-mono tabular-nums" : ""
                            }`}
                          >
                            {cell ? renderInline(cell) : <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={idx}
              className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={idx}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"
            >
              {block.lines.map((line, lineIdx) => (
                <p key={lineIdx}>{renderInline(line)}</p>
              ))}
            </blockquote>
          );
        }

        if (block.type === "hr") {
          return <hr key={idx} className="border-slate-200" />;
        }

        return (
          <p key={idx} className="whitespace-pre-wrap">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
