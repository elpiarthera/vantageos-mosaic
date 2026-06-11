/**
 * Toast.logic.ts — shared pure logic (no JSX, no runtime dependency).
 *
 * Used by both React 19 and Preact 10 runtime implementations.
 */

export type ToastVariant = "success" | "error" | "info" | "warning";

/**
 * WCAG-AA aria-live / role rules:
 * - "error" → role="alert"  + aria-live="assertive"  (interrupts — user must know immediately)
 * - all others → role="status" + aria-live="polite"   (non-intrusive)
 */
export function getAriaRole(variant: ToastVariant): "alert" | "status" {
  return variant === "error" ? "alert" : "status";
}

export function getAriaLive(variant: ToastVariant): "assertive" | "polite" {
  return variant === "error" ? "assertive" : "polite";
}

/**
 * Tailwind class maps per variant.
 */
export const variantContainerClasses: Record<ToastVariant, string> = {
  success: "bg-green-50 text-green-900 ring-1 ring-green-300 border-l-4 border-green-500",
  error: "bg-red-50 text-red-900 ring-1 ring-red-300 border-l-4 border-red-600",
  info: "bg-blue-50 text-blue-900 ring-1 ring-blue-300 border-l-4 border-blue-500",
  warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-300 border-l-4 border-amber-500",
};

export const variantTitleClasses: Record<ToastVariant, string> = {
  success: "text-green-900 font-semibold",
  error: "text-red-900 font-semibold",
  info: "text-blue-900 font-semibold",
  warning: "text-amber-900 font-semibold",
};

export const variantDescriptionClasses: Record<ToastVariant, string> = {
  success: "text-green-800",
  error: "text-red-800",
  info: "text-blue-800",
  warning: "text-amber-800",
};

export const variantCloseClasses: Record<ToastVariant, string> = {
  success: "text-green-700 hover:bg-green-100 focus-visible:outline-green-600",
  error: "text-red-700 hover:bg-red-100 focus-visible:outline-red-600",
  info: "text-blue-700 hover:bg-blue-100 focus-visible:outline-blue-600",
  warning: "text-amber-700 hover:bg-amber-100 focus-visible:outline-amber-600",
};
