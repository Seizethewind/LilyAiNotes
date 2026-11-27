export interface ChunkDraft {
  position: number;
  headingPath: string;
  text: string;
  contextPrefix: string;
}

export function chunkMarkdown(
  title: string,
  summary: string,
  content: string,
  targetWords = 400,
  overlapWords = 50,
): ChunkDraft[] {
  const sections: Array<[string, string]> = [];
  let headingStack: string[] = [];
  let buffer: string[] = [];

  for (const line of content.split("\n")) {
    const match = line.trim().match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      if (buffer.length > 0) {
        sections.push([headingStack.join(" > "), buffer.join("\n").trim()]);
        buffer = [];
      }
      const level = match[1].length;
      headingStack = [...headingStack.slice(0, level - 1), match[2].trim()];
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length > 0 || sections.length === 0) {
    sections.push([headingStack.join(" > "), buffer.join("\n").trim() || content]);
  }

  const chunks: ChunkDraft[] = [];
  let pos = 0;
  for (const [headingPath, body] of sections) {
    const words = body.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + targetWords, words.length);
      let prefix = `Title: ${title}`;
      if (headingPath) prefix += ` | Section: ${headingPath}`;
      if (summary) prefix += ` | Summary: ${summary}`;
      chunks.push({
        position: pos,
        headingPath,
        text: words.slice(start, end).join(" "),
        contextPrefix: prefix,
      });
      pos += 1;
      if (end >= words.length) break;
      start = Math.max(end - overlapWords, start + 1);
    }
  }
  return chunks;
}
