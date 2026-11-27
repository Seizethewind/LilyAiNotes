import { Link } from "@remix-run/react";

import { AppShell } from "~/components/layout/AppShell";

interface PlannedPhaseViewProps {
  title: string;
  phase: string;
  endpoint: string;
  summary: string;
}

export function PlannedPhaseView({ title, phase, endpoint, summary }: PlannedPhaseViewProps) {
  return (
    <AppShell title={title} breadcrumb={phase}>
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-xs font-medium text-slate-500">{phase}</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{summary}</p>
        <p className="mt-4 font-mono text-xs text-slate-500">Backend endpoint status: {endpoint} (501)</p>
        <Link
          to="/documents"
          className="mt-6 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800"
        >
          Manage Notes in Documents
        </Link>
      </div>
    </AppShell>
  );
}
