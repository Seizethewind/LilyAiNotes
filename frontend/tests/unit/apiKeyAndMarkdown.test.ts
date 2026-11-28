// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ENDPOINT_DOCS_CATALOG, filterEndpointDocs } from "../../app/data/endpointDocsCatalog";
import { formatMarkdownTable } from "../../app/utils/formatMarkdownTable";
import { parseInlineMarkdown } from "../../app/utils/parseInlineMarkdown";
import { parseMarkdownBlocks } from "../../app/utils/parseMarkdownBlocks";
import { generateApiKey } from "../../functions/_lib/crypto/generateApiKey";
import { scanForSecrets } from "../../functions/_lib/validation/scanForSecrets";

describe("LilyAiApikey format, Markdown tables, and endpoint catalog", () => {
  it("generates LilyAiApikey followed by 20 random alphanumeric characters", () => {
    const first = generateApiKey();
    const second = generateApiKey();

    expect(first.fullKey).toMatch(/^LilyAiApikey[A-Za-z0-9]{20}$/);
    expect(first.fullKey).toHaveLength(32);
    expect(first.prefix).toBe(first.fullKey.slice(0, 16));
    expect(second.fullKey).toMatch(/^LilyAiApikey[A-Za-z0-9]{20}$/);
    expect(first.fullKey).not.toBe(second.fullKey);
  });

  it("blocks literal LilyAiApikey secrets in notes while allowing documentation placeholders", () => {
    const generated = generateApiKey();
    expect(() => scanForSecrets(`Bearer ${generated.fullKey}`)).toThrowError(/secret detected/i);
    expect(() => scanForSecrets("Use Authorization: Bearer LilyAiApikey... in headers.")).not.toThrow();
  });

  it("formats and parses GFM Markdown tables with alignments and pipe escaping", () => {
    const md = formatMarkdownTable({
      headers: ["Service", "Port", "Status"],
      alignments: ["left", "right", "center"],
      rows: [
        ["API | v1", "8788", "Active"],
        ["UI", "3000", "Active"],
      ],
    });

    const blocks = parseMarkdownBlocks(`# Ports\n\n${md}`);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: "heading", level: 1, text: "Ports" });
    expect(blocks[1]).toEqual({
      type: "table",
      headers: ["Service", "Port", "Status"],
      alignments: ["left", "right", "center"],
      rows: [
        ["API | v1", "8788", "Active"],
        ["UI", "3000", "Active"],
      ],
    });
  });

  it("sanitizes inline markdown links to block unsafe javascript and data URIs", () => {
    const safe = parseInlineMarkdown("Read [Docs](https://example.com) and [Run](javascript:alert(1)).");
    expect(safe).toEqual([
      { type: "text", value: "Read " },
      { type: "link", label: "Docs", href: "https://example.com" },
      { type: "text", value: " and " },
      { type: "text", value: "[Run](javascript:alert(1))" },
      { type: "text", value: "." },
    ]);
  });

  it("filters the Endpoint Docs catalog by search query and group", () => {
    expect(ENDPOINT_DOCS_CATALOG.length).toBeGreaterThanOrEqual(20);
    const matches = filterEndpointDocs("/keys", "API Keys & Audit");
    expect(matches.some((m) => m.id === "keys-create")).toBe(true);
    expect(filterEndpointDocs("nonexistent-xyz-endpoint", "")).toEqual([]);
  });
});
