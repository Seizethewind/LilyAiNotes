export interface BrowserPdfResult {
  text: string;
  pageCount: number;
}

export async function extractPdfTextInBrowser(raw: Uint8Array): Promise<BrowserPdfResult> {
  const [pdfjs, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  const loadingTask = pdfjs.getDocument({ data: raw });
  const doc = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const lines: string[] = [];
      let currentLine: string[] = [];
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if (!("str" in item)) continue;
        const y = Array.isArray(item.transform) ? Number(item.transform[5]) : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 4 && currentLine.length > 0) {
          lines.push(currentLine.join(" ").trim());
          currentLine = [];
        }
        if (item.str.trim()) currentLine.push(item.str);
        if (y !== null) lastY = y;
      }
      if (currentLine.length > 0) {
        lines.push(currentLine.join(" ").trim());
      }
      const pageText = lines.filter(Boolean).join("\n");
      if (pageText) pages.push(pageText);
    }

    return { text: pages.join("\n\n").trim(), pageCount: doc.numPages };
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}
