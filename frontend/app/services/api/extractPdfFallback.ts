import { apiRequest } from "~/services/api/apiClient";

export interface PdfFallbackResponse {
  title: string;
  content: string;
  byteLength: number;
  exceedsLimit: boolean;
  method: "pdf-gemini";
  model: string;
}

export async function extractPdfFallback(file: File, token: string | null): Promise<PdfFallbackResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<PdfFallbackResponse>("/notes/extract-pdf", {
    method: "POST",
    body: form,
    token,
    isFormData: true,
  });
}
