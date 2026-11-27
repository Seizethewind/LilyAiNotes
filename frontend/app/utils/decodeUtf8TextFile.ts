export interface DecodedDocumentText {
  content: string;
  formatLabel: string;
  byteLength: number;
}

export function decodeUtf8TextFile(filename: string, raw: Uint8Array): DecodedDocumentText {
  if (raw.byteLength === 0) {
    throw new Error("The selected file is empty.");
  }
  if (raw.includes(0)) {
    throw new Error("Binary file detected. Only PDF and UTF-8 text documents are supported.");
  }
  const isExe = raw.length >= 2 && raw[0] === 0x4d && raw[1] === 0x5a;
  const isElf = raw.length >= 4 && raw[0] === 0x7f && raw[1] === 0x45 && raw[2] === 0x4c && raw[3] === 0x46;
  const isZip = raw.length >= 4 && raw[0] === 0x50 && raw[1] === 0x4b && raw[2] === 0x03 && raw[3] === 0x04;
  const isPng = raw.length >= 4 && raw[0] === 0x89 && raw[1] === 0x50 && raw[2] === 0x4e && raw[3] === 0x47;
  const isJpeg = raw.length >= 3 && raw[0] === 0xff && raw[1] === 0xd8 && raw[2] === 0xff;
  if (isExe || isElf || isZip || isPng || isJpeg) {
    throw new Error("Binary executables, archives, and images cannot be converted directly as text.");
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    throw new Error("File is not valid UTF-8 text.");
  }
  if (!text.trim()) {
    throw new Error("The selected text document has no readable content.");
  }

  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) {
    try {
      const pretty = JSON.stringify(JSON.parse(text), null, 2);
      return {
        content: pretty,
        formatLabel: "JSON (pretty-printed)",
        byteLength: new TextEncoder().encode(pretty).byteLength,
      };
    } catch {
      throw new Error("JSON file contains invalid JSON syntax.");
    }
  }

  return {
    content: text,
    formatLabel: lower.endsWith(".md") || lower.endsWith(".markdown") ? "Markdown" : "UTF-8 Text",
    byteLength: raw.byteLength,
  };
}
