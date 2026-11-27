import { useState } from "react";

import { extractPdfFallback } from "~/services/api/extractPdfFallback";
import { convertUploadedFileToText } from "~/utils/convertUploadedFileToText";

export function useDocumentImport(
  token: string | null,
  onConverted: (result: { suggestedTitle: string; content: string }) => void,
  onError: (message: string | null) => void,
) {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPdfSource, setIsPdfSource] = useState(false);
  const [usedAiFallback, setUsedAiFallback] = useState(false);
  const [extracting, setExtracting] = useState(false);

  async function selectFile(file: File) {
    onError(null);
    setExtracting(true);
    setSourceFile(file);
    try {
      const converted = await convertUploadedFileToText(file, token);
      onConverted({ suggestedTitle: converted.suggestedTitle, content: converted.content });
      setSourceFormat(converted.formatLabel);
      setStatusMessage(converted.statusMessage);
      setIsPdfSource(converted.isPdf);
      setUsedAiFallback(converted.usedAi);
    } catch (err) {
      setStatusMessage(null);
      onError(err instanceof Error ? err.message : "Failed to convert document to text.");
    } finally {
      setExtracting(false);
    }
  }

  async function retryWithAi() {
    if (!sourceFile) return;
    onError(null);
    setExtracting(true);
    try {
      const aiResult = await extractPdfFallback(sourceFile, token);
      onConverted({ suggestedTitle: aiResult.title, content: aiResult.content });
      setSourceFormat("PDF (Gemini OCR)");
      setStatusMessage(`Extracted via ${aiResult.model}`);
      setUsedAiFallback(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : "AI extraction fallback failed.");
    } finally {
      setExtracting(false);
    }
  }

  return {
    sourceFile,
    sourceFormat,
    statusMessage,
    isPdfSource,
    usedAiFallback,
    extracting,
    selectFile,
    retryWithAi,
  };
}
