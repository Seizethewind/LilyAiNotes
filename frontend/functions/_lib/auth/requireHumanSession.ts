import { AppError } from "../types/env";
import type { AuthPrincipal } from "../types/env";

export function requireHumanSession(principal: AuthPrincipal): AuthPrincipal {
  if (principal.kind !== "human") {
    throw new AppError("forbidden", "This operation is restricted to signed-in human sessions.", 403);
  }
  return principal;
}
