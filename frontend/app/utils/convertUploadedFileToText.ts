import { extractPdfFallback } from "~/services/api/extractPdfFallback";
import { decodeUtf8TextFile } from "~/utils/decodeUtf8TextFile";
import { extractPdfTextInBrowser } from "~/utils/extractPdfTextInBrowser";

export interface ConvertedDocumentResult {
  suggestedTitle: string;
  content: string;
  formatLabel: string;
  statusMessage: string;
  isPdf: boolean;
  usedAi: boolean;
}

export async function convertUploadedFileToText(
  file: File,
  token: string | null,
): Promise<ConvertedDocumentResult> {
  const raw = new Uint8Array(await file.arrayBuffer());
  const suggestedTitle = file.name.replace(/\.[^.]+$/, "").trim() || file.name;
  const isPdfHeader = raw.length >= 5 && new TextDecoder().decode(raw.slice(0, 5)) === "%PDF-";
  const isPdf = file.name.toLowerCase().endsWith(".pdf") || isPdfHeader;

  if (isPdf) {
    let browserError: unknown = null;
    try {
      const browserResult = await extractPdfTextInBrowser(raw);
      if (browserResult.text.replace(/\s+/g, "").length >= 20) {
        return {
          suggestedTitle,
          content: browserResult.text,
          formatLabel: `PDF (${browserResult.pageCount}p, browser)`,
          statusMessage: "Extracted locally",
          isPdf: true,
          usedAi: false,
        };
      }
    } catch (err) {
      browserError = err;
    }

    try {
      const aiResult = await extractPdfFallback(file, token);
      return {
        suggestedTitle: aiResult.title || suggestedTitle,
        content: aiResult.content,
        formatLabel: "PDF (Gemini OCR)",
        statusMessage: `Extracted via ${aiResult.model}`,
        isPdf: true,
        usedAi: true,
      };
    } catch (aiErr) {
      if (aiErr instanceof Error) throw aiErr;
      if (browserError instanceof Error) throw browserError;
      throw new Error("Unable to extract text from PDF.");
    }
  }

  const decoded = decodeUtf8TextFile(file.name, raw);
  return {
    suggestedTitle,
    content: decoded.content,
    formatLabel: decoded.formatLabel,
    statusMessage: "Ready to review",
    isPdf: false,
    usedAi: false,
  };
}
