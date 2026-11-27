import { apiRequest } from "~/services/api/apiClient";
import type { ClassificationSuggestion } from "~/types/api";

export async function requestClassification(
  input: { title?: string; content: string; filename?: string; useAi: boolean },
  token: string | null,
): Promise<ClassificationSuggestion> {
  return apiRequest<ClassificationSuggestion>("/notes/classify", {
    method: "POST",
    token,
    body: {
      title: input.title,
      content: input.content,
      filename: input.filename,
      use_ai: input.useAi,
    },
  });
}
