import { PlannedPhaseView } from "~/components/layout/PlannedPhaseView";

export default function KnowledgeRoute() {
  return (
    <PlannedPhaseView
      title="Knowledge Browser"
      phase="Phase 5 — Hybrid & Vector Search"
      endpoint="/api/v1/knowledge"
      summary="Vector embeddings and hybrid ranking will expand this browser once pgvector indexing lands. Full-text search and topic browsing are active now in Documents."
    />
  );
}
