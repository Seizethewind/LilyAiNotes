import { AppError } from "../types/env";

const SECRET_PATTERNS: ReadonlyArray<[string, RegExp]> = [
  ["OpenAI-style API key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["GitHub token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Private key block", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["Credential assignment", /\b(?:password|secret|api_key)\s*[:=]\s*['"][^'"]{12,}['"]/i],
];

export function scanForSecrets(text: string): void {
  for (const [label, pattern] of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      throw new AppError(
        "secret_detected",
        `Write rejected: potential secret detected (${label}). Remove credentials before saving.`,
        422,
      );
    }
  }
}
