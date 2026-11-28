import { Minus, Plus, Table } from "lucide-react";
import { useState } from "react";

import { formatMarkdownTable } from "~/utils/formatMarkdownTable";
import type { TableAlignment } from "~/utils/formatMarkdownTable";

interface MarkdownTableBuilderProps {
  onInsert: (markdownTable: string) => void;
  onClose: () => void;
}

const MAX_COLS = 8;
const MAX_ROWS = 20;

export function MarkdownTableBuilder({ onInsert, onClose }: MarkdownTableBuilderProps) {
  const [headers, setHeaders] = useState<string[]>(["Item", "Details", "Status"]);
  const [alignments, setAlignments] = useState<TableAlignment[]>(["left", "left", "left"]);
  const [rows, setRows] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
  ]);

  function addColumn() {
    if (headers.length >= MAX_COLS) return;
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setAlignments([...alignments, "left"]);
    setRows(rows.map((r) => [...r, ""]));
  }

  function removeColumn() {
    if (headers.length <= 1) return;
    setHeaders(headers.slice(0, -1));
    setAlignments(alignments.slice(0, -1));
    setRows(rows.map((r) => r.slice(0, -1)));
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    setRows([...rows, Array.from({ length: headers.length }, () => "")]);
  }

  function removeRow() {
    if (rows.length <= 1) return;
    setRows(rows.slice(0, -1));
  }

  function cycleAlignment(colIndex: number) {
    const order: TableAlignment[] = ["left", "center", "right"];
    const next = order[(order.indexOf(alignments[colIndex]) + 1) % order.length];
    setAlignments(alignments.map((a, idx) => (idx === colIndex ? next : a)));
  }

  function handleInsert() {
    onInsert(formatMarkdownTable({ headers, rows, alignments }));
    onClose();
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
          <Table className="h-4 w-4 text-blue-700" aria-hidden="true" />
          <span>Table Builder</span>
          <span className="font-mono font-normal text-slate-500 tabular-nums">
            {headers.length} cols · {rows.length} rows
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={removeColumn}
            disabled={headers.length <= 1}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
            <span>Col</span>
          </button>
          <button
            type="button"
            onClick={addColumn}
            disabled={headers.length >= MAX_COLS}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            <span>Col</span>
          </button>
          <button
            type="button"
            onClick={removeRow}
            disabled={rows.length <= 1}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
            <span>Row</span>
          </button>
          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= MAX_ROWS}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            <span>Row</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {headers.map((header, colIdx) => (
                <th key={colIdx} className="min-w-[120px] border-r border-slate-200 p-1.5 last:border-r-0">
                  <div className="space-y-1">
                    <input
                      aria-label={`Header column ${colIdx + 1}`}
                      value={header}
                      onChange={(e) =>
                        setHeaders(headers.map((h, idx) => (idx === colIdx ? e.target.value : h)))
                      }
                      placeholder={`Column ${colIdx + 1}`}
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-900 focus:border-blue-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => cycleAlignment(colIdx)}
                      className="w-full rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 whitespace-nowrap"
                    >
                      Align: {alignments[colIdx]}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-slate-100 last:border-b-0">
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="border-r border-slate-100 p-1.5 last:border-r-0">
                    <input
                      aria-label={`Row ${rowIdx + 1} Column ${colIdx + 1}`}
                      value={cell}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, rIdx) =>
                            rIdx === rowIdx ? r.map((c, cIdx) => (cIdx === colIdx ? e.target.value : c)) : r,
                          ),
                        )
                      }
                      placeholder="Cell value"
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-slate-800 focus:border-blue-700 focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleInsert}
          className="min-h-[36px] rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap"
        >
          Insert Table
        </button>
      </div>
    </div>
  );
}
