import { AlertTriangle, CheckCircle2, Clock, RefreshCw, ShieldAlert } from "lucide-react";

import type { NoteStatus } from "~/types/api";

export function StatusLabel({ status }: { status: NoteStatus | string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Verified</span>
      </span>
    );
  }
  if (status === "unverified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Unverified</span>
      </span>
    );
  }
  if (status === "disputed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Disputed</span>
      </span>
    );
  }
  if (status === "superseded") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Superseded</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Draft</span>
    </span>
  );
}
