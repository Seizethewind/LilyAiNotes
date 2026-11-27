import { jsonResponse } from "./jsonResponse";
import { AppError } from "../types/env";

export function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return jsonResponse({ error: { code: err.code, message: err.message } }, err.statusCode);
  }
  console.error("Unhandled API error:", err);
  return jsonResponse(
    { error: { code: "internal_error", message: "An internal server error occurred." } },
    500,
  );
}
