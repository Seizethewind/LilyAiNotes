import { AppError } from "../types/env";
import type { AuthPrincipal } from "../types/env";

export function requireWriteScope(principal: AuthPrincipal): AuthPrincipal {
  if (principal.kind === "human") return principal;
  if (principal.scope !== "read+write") {
    throw new AppError("insufficient_scope", "API key requires 'read+write' scope for this operation.", 403);
  }
  return principal;
}
