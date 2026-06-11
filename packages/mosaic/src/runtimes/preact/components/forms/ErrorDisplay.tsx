"use client";

import { formatErrorMessage } from "../../../../components/forms/ErrorDisplay.logic.js";
import type { FieldErrorShape } from "../../../../components/forms/ErrorDisplay.schema.js";

export interface ErrorDisplayProps {
  error?: FieldErrorShape;
  messageMap?: Record<string, string>;
  className?: string;
}

/**
 * Single-field error formatter. Renders nothing when `error` is undefined
 * (no error to show), otherwise emits a `role="alert"` element with the
 * resolved message. Message resolution is delegated to the pure
 * `formatErrorMessage` helper so React and Preact runtimes share behavior.
 */
export function ErrorDisplay({ error, messageMap, className }: ErrorDisplayProps) {
  const message = formatErrorMessage(error, messageMap);
  if (!message) return null;
  return (
    <span role="alert" className={className ?? "mosaic-forms-error"}>
      {message}
    </span>
  );
}
