import { AppError } from "../types/env";
import type { AuthPrincipal } from "../types/env";

export function resolveEffectiveProject(
  principal: AuthPrincipal,
  requestedProject?: string | null,
): string | undefined {
  const cleaned = (requestedProject || "").trim();
  if (!principal.allowedProject) {
    return cleaned || undefined;
  }
  if (cleaned && cleaned !== principal.allowedProject) {
    throw new AppError(
      "forbidden",
      `This API key is restricted to project '${principal.allowedProject}'.`,
      403,
    );
  }
  return principal.allowedProject;
}
