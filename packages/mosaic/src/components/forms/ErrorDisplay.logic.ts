import type { FieldErrorShape } from "./ErrorDisplay.schema.js";

/**
 * Pure formatter shared by React + Preact runtimes.
 *
 * Priority order:
 *   1. `error.message` set by Zod/RHF → win (explicit wins).
 *   2. `messageMap[error.type]` → consumer-controlled i18n fallback.
 *   3. Generic fallback string ("Invalid value").
 */
export function formatErrorMessage(
  error: FieldErrorShape | undefined,
  messageMap: Record<string, string> | undefined,
): string | undefined {
  if (!error) return undefined;
  if (error.message && error.message.length > 0) return error.message;
  const mapped = messageMap?.[error.type];
  if (mapped && mapped.length > 0) return mapped;
  return "Invalid value";
}
