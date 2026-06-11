/**
 * Pure helpers for Input. Runtime-agnostic — shared between React and Preact
 * runtimes via the `src/components/forms/` co-location pattern (Standard §18.2).
 */

import type { InputType } from "./Input.schema.js";

/**
 * Build the deterministic input element id from form name + field name.
 * Used to wire `<label htmlFor>`, `aria-describedby` and the error element id.
 *
 * Mirrors `buildFieldId` from `FormField.logic.ts` but namespaced for Input so
 * future primitives (Textarea, Select) can compose their own id conventions.
 */
export function buildInputId(formName: string | undefined, fieldName: string): string {
  return formName ? `${formName}-${fieldName}` : `mosaic-input-${fieldName}`;
}

/**
 * `aria-describedby` value — the id of the error element, only emitted when an
 * error exists. Otherwise undefined (omit the attribute entirely).
 */
export function buildErrorDescribedBy(inputId: string, hasError: boolean): string | undefined {
  return hasError ? `${inputId}-error` : undefined;
}

/**
 * Map our public `type` prop to the HTML `type` attribute. Currently a 1:1
 * passthrough — the indirection exists so future types (e.g. `search`,
 * `tel`) can be widened without touching the runtime components.
 */
export function resolveHtmlType(type: InputType | undefined): InputType {
  return type ?? "text";
}
