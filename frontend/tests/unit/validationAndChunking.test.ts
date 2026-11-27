// @vitest-environment node
import { describe, expect, it } from "vitest";

import { chunkMarkdown } from "../../functions/_lib/processing/chunkMarkdown";
import { AppError, MAX_NOTE_BYTES } from "../../functions/_lib/types/env";
import { normalizeText } from "../../functions/_lib/validation/normalizeText";
import { scanForSecrets } from "../../functions/_lib/validation/scanForSecrets";
import { validateUpload } from "../../functions/_lib/validation/validateUpload";
import { validateUtf8Text } from "../../functions/_lib/validation/validateUtf8Text";

describe("validation and markdown chunking", () => {
  it("validates UTF-8 text and rejects invalid bytes or oversized payloads", () => {
    const valid = new TextEncoder().encode("Cloudflare D1 note");
    expect(validateUtf8Text(valid)).toBe("Cloudflare D1 note");

    const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]);
    expect(() => validateUtf8Text(invalidUtf8)).toThrowError(AppError);

    const oversized = new Uint8Array(MAX_NOTE_BYTES + 1).fill(0x61);
    expect(() => validateUtf8Text(oversized)).toThrowError(/exceeds maximum/);
  });

  it("blocks embedded API keys and private keys during secret scan", () => {
    expect(() => scanForSecrets("normal technical note")).not.toThrow();
    expect(() => scanForSecrets("token = sk-1234567890abcdefghij12345")).toThrowError(/secret detected/i);
    expect(() => scanForSecrets("-----BEGIN PRIVATE KEY-----")).toThrowError(/secret detected/i);
  });

  it("normalizes CRLF line endings and validates UTF-8 text, JSON formatting, and binary/PDF guards", () => {
    expect(normalizeText("line 1  \r\nline 2\t\r\n")).toBe("line 1\nline 2");
    expect(validateUpload("notes.md", new TextEncoder().encode("# Title\nBody"))).toBe("# Title\nBody");
    expect(validateUpload("server.log", new TextEncoder().encode("2026-11-27 OK"))).toBe("2026-11-27 OK");
    expect(validateUpload("README", new TextEncoder().encode("Extensionless UTF-8 note"))).toBe("Extensionless UTF-8 note");
    expect(validateUpload("config.json", new TextEncoder().encode('{"a":1,"b":[2]}'))).toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}');
    expect(() => validateUpload("bad.json", new TextEncoder().encode("{oops"))).toThrowError(/invalid JSON/i);
    expect(() => validateUpload("archive.pdf", new TextEncoder().encode("%PDF-1.7"))).toThrowError(/extract-pdf/);
    expect(() => validateUpload("app.exe", new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toThrowError(/Binary/);
  });

  it("chunks markdown preserving heading hierarchy and context prefix", () => {
    const md = "# Architecture\nIntro text\n## Storage\nCloudflare R2 stores originals.";
    const chunks = chunkMarkdown("Storage Plan", "R2 and D1 layout", md, 20, 5);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[1].headingPath).toBe("Architecture > Storage");
    expect(chunks[1].contextPrefix).toContain("Title: Storage Plan");
    expect(chunks[1].contextPrefix).toContain("Section: Architecture > Storage");
  });
});
