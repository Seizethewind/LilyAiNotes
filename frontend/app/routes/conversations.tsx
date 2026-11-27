import { PlannedPhaseView } from "~/components/layout/PlannedPhaseView";

export default function ConversationsRoute() {
  return (
    <PlannedPhaseView
      title="Conversations"
      phase="Phase 6 — Assistant Sessions"
      endpoint="/api/v1/conversations"
      summary="Persistent conversation logs and summaries will appear here once the provider-independent AI service layer is connected."
    />
  );
}
