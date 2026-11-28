import { AppError } from "../types/env";
import type { Env } from "../types/env";

/** Session signing fails closed: there is deliberately no fallback secret. */
export function getSessionSecret(env: Env): string {
  const secret = env.APP_SECRET_KEY?.trim();
  if (!secret) {
    throw new AppError("auth_unconfigured", "APP_SECRET_KEY is not configured on the server.", 503);
  }
  return secret;
}
