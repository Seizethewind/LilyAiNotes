export function normalizeTags(input: unknown): string[] {
  const rawList = Array.isArray(input)
    ? input.map((v) => String(v))
    : typeof input === "string"
      ? input.split(",")
      : [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of rawList) {
    const slug = raw
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);

    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    normalized.push(slug);
    if (normalized.length >= 5) break;
  }

  return normalized;
}
