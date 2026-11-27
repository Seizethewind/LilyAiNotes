import { GoogleGenAI } from "@google/genai";

import { encodeBase64 } from "../crypto/encodeBase64";
import { AppError } from "../types/env";
import type { Env } from "../types/env";

export async function extractPdfWithGemini(
  env: Env,
  pdfBytes: Uint8Array,
  filename: string,
): Promise<{ text: string; model: string }> {
  const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    throw new AppError(
      "ai_provider_unconfigured",
      "GEMINI_API_KEY is not configured on the server for scanned PDF fallback. Add it to Cloudflare Pages Secrets or .dev.vars.",
      503,
    );
  }

  const model = "gemini-4-hydrogen";
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: encodeBase64(pdfBytes),
            },
          },
          {
            text: `Extract all readable text from "${filename}" and return clean Markdown or plain text. Preserve headings, bullet lists, code blocks, and tables faithfully. Do not add commentary or preamble.`,
          },
        ],
      },
      config: {
        systemInstruction:
          "You are a precise document-to-text converter. Return only the extracted text content in clean UTF-8 Markdown without conversational wrapper text.",
      },
    });
    const text = (response.text || "").trim();
    if (!text) {
      throw new AppError("pdf_extraction_empty", "No readable text could be extracted from this PDF.", 422);
    }
    return { text, model };
  } catch (err) {
    if (err instanceof AppError) throw err;
    const msg = err instanceof Error ? err.message : "PDF extraction request failed.";
    throw new AppError("ai_provider_error", `PDF extraction fallback failed: ${msg}`, 502);
  }
}
