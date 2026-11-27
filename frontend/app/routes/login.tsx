import { useNavigate } from "@remix-run/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { useSession } from "~/context/SessionContext";
import { ApiClientError, apiRequest } from "~/services/api/apiClient";
import type { AuthSessionResponse } from "~/types/api";

export default function LoginRoute() {
  const navigate = useNavigate();
  const { setAuthSession } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Primary Workspace");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, display_name: displayName, workspace_name: workspaceName, password };
      const session = await apiRequest<AuthSessionResponse>(endpoint, { method: "POST", body });
      setAuthSession(session);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">LilyAiDataNotes</h1>
          <p className="text-sm text-slate-600">
            Sign in to manage persistent knowledge notes, versions, and scoped AI keys.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mode === "login" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mode === "register" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Create Workspace
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label htmlFor="display-name" className="mb-1 block text-xs font-medium text-slate-700">
                  Display Name
                </label>
                <input
                  id="display-name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="workspace-name" className="mb-1 block text-xs font-medium text-slate-700">
                  Workspace Name
                </label>
                <input
                  id="workspace-name"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={mode === "register" ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting
              ? "Connecting..."
              : mode === "login"
                ? "Sign in"
                : "Create account & workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
