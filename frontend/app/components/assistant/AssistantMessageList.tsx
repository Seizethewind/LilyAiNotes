import { Link } from "@remix-run/react";

import { StatusLabel } from "~/components/documents/StatusLabel";
import type { AssistantCitation } from "~/types/api";

export interface AssistantChatMessage {
  role: "user" | "assistant";
  text: string;
  scannedHeaders?: number;
  selectedKeys?: string[];
  citations?: AssistantCitation[];
}

export function AssistantMessageList({ messages }: { messages: AssistantChatMessage[] }) {
  return (
    <div className="min-h-[320px] space-y-4">
      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Ask about stored decisions, configs, procedures, or reference notes by topic or ID key.
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg border p-4 text-sm ${
              msg.role === "user"
                ? "ml-auto max-w-2xl border-blue-200 bg-blue-50 text-slate-900"
                : "max-w-3xl border-slate-200 bg-slate-50 text-slate-900"
            }`}
          >
            <p className="mb-1 text-xs font-semibold text-slate-500">
              {msg.role === "user" ? "You" : "Assistant"}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            {msg.role === "assistant" && typeof msg.scannedHeaders === "number" && (
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                <p className="font-mono text-xs text-slate-500 tabular-nums">
                  Scanned {msg.scannedHeaders} header{msg.scannedHeaders === 1 ? "" : "s"}
                  {msg.selectedKeys && msg.selectedKeys.length > 0
                    ? ` · Selected ${msg.selectedKeys.join(", ")}`
                    : " · No matching ID keys selected"}
                </p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {msg.citations.map((c) => (
                      <Link
                        key={c.id}
                        to={`/documents?note=${encodeURIComponent(c.id)}`}
                        className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 hover:underline"
                      >
                        <span className="font-mono font-semibold tabular-nums">{c.note_key}</span>
                        <span>{c.title}</span>
                        <StatusLabel status={c.status} />
                        <span className="font-mono text-slate-400 tabular-nums">v{c.version}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
