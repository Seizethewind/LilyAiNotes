import { PlannedPhaseView } from "~/components/layout/PlannedPhaseView";

export default function MemoryRoute() {
  return (
    <PlannedPhaseView
      title="Hybrid Memory"
      phase="Phase 6 — Scoped Agent & Project Memory"
      endpoint="/api/v1/memory"
      summary="Global, project, agent, conversation, and private memory scopes with consolidation policies will be enabled here after retrieval verification."
    />
  );
}
