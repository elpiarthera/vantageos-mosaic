/**
 * EmptyState.logic.ts — pure, framework-agnostic helpers.
 * No JSX here — shared between React 19 and Preact 10 runtimes.
 */

export type EmptyStateActionVariant = "primary" | "secondary";

/**
 * Tailwind class maps for CTA button variants.
 * Using slate neutrals (OKLCH-tinted, never pure gray).
 */
export const ACTION_VARIANT_CLASSES: Record<EmptyStateActionVariant, string> = {
  primary:
    "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:pointer-events-none disabled:opacity-50",
};
