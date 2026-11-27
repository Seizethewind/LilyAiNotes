import { normalizeTags } from "./normalizeTags";

export interface ClassificationSuggestion {
  type: string;
  tags: string[];
  summary: string;
  reason: string;
  source: "rules" | "gemini";
}

export function classifyByRules(input: {
  title?: string;
  content: string;
  filename?: string;
}): ClassificationSuggestion {
  const filename = (input.filename || "").toLowerCase();
  const title = (input.title || "").trim();
  const content = (input.content || "").trim();
  const sample = `${title}\n${content.slice(0, 2000)}`;
  const lower = sample.toLowerCase();

  let type = "fact";
  let reason = "General reference or factual knowledge.";
  const inferredTags: string[] = [];

  if (/\.(json|ya?ml|toml|ini|env|conf)$/i.test(filename) || (/^\s*[[{]/.test(content) && /"\w+"\s*:/.test(sample))) {
    type = "config";
    reason = "Detected structured configuration syntax.";
    inferredTags.push("config");
  } else if (/\.(ts|tsx|js|jsx|py|sql|go|rs|java|kt|sh|css|html)$/i.test(filename) || /```[\w-]+|\b(export function|import\s+.+\s+from|CREATE TABLE|SELECT\s+.+\s+FROM)\b/.test(sample)) {
    type = "code";
    reason = "Detected source code or database query syntax.";
    inferredTags.push("code");
  } else if (/\.log$/i.test(filename) || /\b(INFO|WARN|ERROR|FATAL|TRACE|Exception)\b/.test(sample) && /\d{4}-\d{2}-\d{2}/.test(sample)) {
    type = "log";
    reason = "Detected timestamped log or diagnostic entries.";
    inferredTags.push("logs");
  } else if (/(\n\s*1\.\s+.+\n\s*2\.\s+)|(- \[[ x]\])|\b(how to|runbook|step-by-step|checklist|deployment steps)\b/i.test(lower)) {
    type = "procedure";
    reason = "Detected numbered steps or operational checklist.";
    inferredTags.push("runbook");
  } else if (/\b(decision|adr|approved|we chose|trade-off|selected over)\b/i.test(lower)) {
    type = "decision";
    reason = "Detected architectural or policy decision language.";
    inferredTags.push("decision");
  } else if (/\b(prefer|preference|convention|always use|never use|style guide|coding rule)\b/i.test(lower)) {
    type = "preference";
    reason = "Detected preference or convention guideline.";
    inferredTags.push("convention");
  }

  if (filename.endsWith(".pdf")) inferredTags.push("pdf-import");
  if (lower.includes("cloudflare") || lower.includes("wrangler") || lower.includes("d1")) inferredTags.push("cloudflare-d1");
  if (lower.includes("auth") || lower.includes("session") || lower.includes("token")) inferredTags.push("auth");
  if (lower.includes("api") || lower.includes("endpoint")) inferredTags.push("api");

  const firstBodyLine = content
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .find((l) => l.length > 8 && !/^[[{}`"-]+$/.test(l));
  const summary = firstBodyLine ? (firstBodyLine.length > 140 ? `${firstBodyLine.slice(0, 137)}...` : firstBodyLine) : title;

  return {
    type,
    tags: normalizeTags(inferredTags),
    summary,
    reason,
    source: "rules",
  };
}
