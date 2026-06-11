/**
 * Pure helpers for Checkbox, shared by React + Preact runtimes.
 *
 * No DOM, no framework imports. Keeps the runtime surface a thin shell so
 * Standard §18 cross-runtime parity holds by reference.
 */

/**
 * Resolve the effective `aria-checked` attribute value for the rendered
 * `<input type="checkbox">`.
 *
 * - `indeterminate=true` → `"mixed"` (ARIA tri-state semantics).
 * - `checked=true`       → `true`.
 * - otherwise            → `false`.
 *
 * The DOM `.indeterminate` property must be set via a ref — it is not an HTML
 * attribute and cannot be set declaratively. This helper only computes the
 * ARIA value; the runtime is responsible for the DOM side-effect.
 */
export function resolveAriaChecked(
  checked: boolean,
  indeterminate: boolean | undefined,
): boolean | "mixed" {
  if (indeterminate) return "mixed";
  return checked;
}

/**
 * Compute the accessible description ID to wire into `aria-describedby`.
 *
 * Returns the `descriptionId` when a `description` string is provided,
 * or `undefined` when no description is present so the attribute is omitted.
 * A falsy description short-circuits to prevent empty `aria-describedby=""`.
 */
export function resolveDescribedBy(
  descriptionId: string,
  description: string | undefined,
  hasError: boolean,
  errorId: string,
): string | undefined {
  const parts: string[] = [];
  if (description) parts.push(descriptionId);
  if (hasError) parts.push(errorId);
  return parts.length > 0 ? parts.join(" ") : undefined;
}
