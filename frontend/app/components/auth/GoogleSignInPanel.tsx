import { useEffect, useState } from "react";

import { apiRequest, getApiBaseUrl } from "~/services/api/apiClient";
import { describeGoogleError } from "~/utils/describeGoogleError";

/** "login" shows the sign-in button; "link" shows the connect control used in Settings. */
export function GoogleSignInPanel({ mode }: { mode: "login" | "link" }) {
  const [status, setStatus] = useState<{ enabled: boolean; linked: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(describeGoogleError(new URLSearchParams(window.location.search).get("google_error")));
    apiRequest<{ enabled: boolean; linked: boolean }>("/auth/google/status")
      .then((result) => {
        if (active) setStatus(result);
      })
      .catch(() => {
        if (active) setStatus(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!status?.enabled && !error) return null;
  const linked = mode === "link" && status?.linked;
  // A plain link, not a router link: OAuth needs a full page navigation.
  const href = `${getApiBaseUrl()}/auth/google/start${mode === "link" ? "?mode=link" : ""}`;

  return (
    <div className={mode === "link" ? "rounded-xl border border-slate-200 bg-white p-6" : "mt-4"}>
      {mode === "link" && <h2 className="mb-2 text-base font-semibold text-slate-900">Google Sign-in</h2>}
      {error && <p role="alert" className="mb-3 text-sm font-medium text-red-700">{error}</p>}
      {linked ? (
        <p className="text-sm text-slate-600">Your Google account is connected.</p>
      ) : (
        status?.enabled && (
          <a
            href={href}
            className={`inline-block rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 ${mode === "login" ? "w-full" : ""}`}
          >
            {mode === "login" ? "Continue with Google" : "Connect Google account"}
          </a>
        )
      )}
    </div>
  );
}
