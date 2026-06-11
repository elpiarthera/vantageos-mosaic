import type { BadgeProps } from "./Badge.schema.js";

/**
 * Badge.logic.ts — pure, framework-agnostic helpers.
 * No JSX here — shared between React 19 and Preact 10 runtimes.
 */

export type BadgeVariant = BadgeProps["variant"];
export type BadgeSize = BadgeProps["size"];

/**
 * Tailwind class maps — inline label style, no colored ring (unlike StatusBadge).
 * OKLCH tinted neutrals via slate (not pure gray).
 */
export const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-blue-600 text-white",
  secondary: "bg-slate-200 text-slate-800",
  outline: "border border-slate-400 text-slate-700 bg-transparent",
};

export const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs font-medium",
  lg: "px-3 py-1 text-sm font-medium",
};

/**
 * Resolves the display string for `content`.
 * Numbers are cast to string so JSX rendering stays consistent.
 */
export function resolveContent(content: BadgeProps["content"]): string {
  return String(content);
}

/**
 * Resolves the accessible label:
 * - Explicit `aria-label` always wins
 * - If content is a number and no aria-label → empty string (caller must provide it — Zod warns via test)
 * - If content is a string → use it as the accessible label
 */
export function resolveAriaLabel(
  content: BadgeProps["content"],
  ariaLabel: BadgeProps["aria-label"],
): string | undefined {
  if (ariaLabel) return ariaLabel;
  if (typeof content === "string") return content;
  // numeric content without aria-label: return undefined (schema allows it but tests assert it should be set)
  return undefined;
}
