import { useState } from "react";
import type { FormEvent } from "react";

import type { ApiKeyRecord } from "~/types/api";

interface ApiKeysPanelProps {
  keys: ApiKeyRecord[];
  revealedKey: string | null;
  onCreate: (name: string, scope: "read" | "read+write") => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
}

export function ApiKeysPanel({ keys, revealedKey, onCreate, onRevoke }: ApiKeysPanelProps) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "read+write">("read");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onCreate(name, scope);
    setName("");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">AI Client API Keys</h2>
      <p className="mt-1 text-xs text-slate-500">
        Keys are hashed on the server and shown once at creation. Write keys can only create drafts.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label htmlFor="key-name" className="mb-1 block text-xs font-medium text-slate-700">
            Client Name
          </label>
          <input
            id="key-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lily MCP Agent"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="key-scope" className="mb-1 block text-xs font-medium text-slate-700">
            Scope
          </label>
          <select
            id="key-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as "read" | "read+write")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="read">read</option>
            <option value="read+write">read+write (drafts only)</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap"
        >
          Create Key
        </button>
      </form>

      {revealedKey && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-900">
            Copy this key now — it will not be shown again:
          </p>
          <p className="mt-1 break-all font-mono text-xs text-emerald-800">{revealedKey}</p>
        </div>
      )}

      <div className="mt-6 divide-y divide-slate-100 border-t border-slate-200">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-4 py-3 text-xs">
            <div>
              <span className="font-medium text-slate-900">{k.name}</span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-mono text-slate-600">{k.key_prefix}...</span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-slate-600">{k.scope}</span>
            </div>
            {k.revoked_at ? (
              <span className="text-red-700">Revoked</span>
            ) : (
              <button
                type="button"
                onClick={() => void onRevoke(k.id)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-red-700 hover:bg-red-50"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
