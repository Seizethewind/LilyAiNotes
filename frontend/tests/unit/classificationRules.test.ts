import { describe, expect, it } from "vitest";

import { classifyTextLocally } from "../../app/utils/classifyTextLocally";
import { classifyByRules } from "../../functions/_lib/classification/classifyByRules";
import { normalizeTags } from "../../functions/_lib/classification/normalizeTags";
import { resolveNoteOrderBy } from "../../functions/_lib/notes/resolveNoteOrderBy";

describe("classification rules, tag normalization, and safe sort allowlist", () => {
  it("normalizes mixed tags into unique lowercase hyphenated slugs capped at 5", () => {
    expect(normalizeTags(["Cloudflare D1", "Auth_Flow", "cloudflare-d1", "a", "b", "c", "d"])).toEqual([
      "cloudflare-d1",
      "auth-flow",
      "a",
      "b",
      "c",
    ]);
  });

  it("detects config, code, log, and procedure content consistently on client and server", () => {
    expect(classifyByRules({ filename: "settings.json", content: '{"env": "prod"}' }).type).toBe("config");
    expect(classifyByRules({ filename: "query.sql", content: "SELECT * FROM notes;" }).type).toBe("code");
    expect(classifyByRules({ filename: "app.log", content: "2026-11-27 ERROR failed" }).type).toBe("log");
    expect(classifyTextLocally({ content: "1. Run tests\n2. Deploy Pages" }).type).toBe("procedure");
  });

  it("maps only allowlisted sort fields and ignores unsafe SQL sort inputs", () => {
    expect(resolveNoteOrderBy("note_key", "asc")).toBe("COALESCE(note_key, id) COLLATE NOCASE ASC, updated_at DESC");
    expect(resolveNoteOrderBy("title; DROP TABLE notes", "asc")).toBe("updated_at ASC, updated_at DESC");
  });
});
