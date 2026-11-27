import { describe, expect, it } from "vitest";

import { decodeUtf8TextFile } from "../../app/utils/decodeUtf8TextFile";
import { hasBinarySignature } from "../../functions/_lib/validation/hasBinarySignature";

describe("document-to-text client decoding and binary detection", () => {
  it("accepts any valid UTF-8 text file and pretty-prints JSON", () => {
    const md = decodeUtf8TextFile("spec.md", new TextEncoder().encode("# Spec\nDetails"));
    expect(md.formatLabel).toBe("Markdown");
    expect(md.content).toBe("# Spec\nDetails");

    const log = decodeUtf8TextFile("worker.log", new TextEncoder().encode("INFO started\n"));
    expect(log.formatLabel).toBe("UTF-8 Text");
    expect(log.content).toBe("INFO started\n");

    const json = decodeUtf8TextFile("data.json", new TextEncoder().encode('{"ok":true}'));
    expect(json.formatLabel).toBe("JSON (pretty-printed)");
    expect(json.content).toBe('{\n  "ok": true\n}');
  });

  it("rejects binary payloads, invalid JSON, and invalid UTF-8 bytes", () => {
    expect(() => decodeUtf8TextFile("bad.json", new TextEncoder().encode("{bad"))).toThrowError(/invalid JSON/i);
    expect(() => decodeUtf8TextFile("img.png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toThrowError(/Binary/);
    expect(() => decodeUtf8TextFile("bad.txt", new Uint8Array([0xff, 0xfe]))).toThrowError(/UTF-8/);
  });

  it("identifies PDF and binary magic signatures accurately", () => {
    expect(hasBinarySignature(new TextEncoder().encode("%PDF-1.7"))).toBe("pdf");
    expect(hasBinarySignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe("binary");
    expect(hasBinarySignature(new TextEncoder().encode("plain utf8 text"))).toBeNull();
  });
});
