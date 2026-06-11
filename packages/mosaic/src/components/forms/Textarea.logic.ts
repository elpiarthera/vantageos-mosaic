/**
 * Pure helpers for Textarea, shared by React + Preact runtimes.
 *
 * No DOM, no framework imports. Keeps the runtime surface a thin shell so
 * Standard §18 cross-runtime parity holds by reference.
 */

export const DEFAULT_TEXTAREA_ROWS = 3;

/**
 * Clamp an input value to `maxLength` characters. When `maxLength` is undefined
 * (no cap), returns the value unchanged. When the input already fits, returns
 * the value unchanged (identity — avoids needless state churn in RHF).
 */
export function clampToMaxLength(value: string, maxLength: number | undefined): string {
  if (maxLength === undefined) return value;
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

/**
 * Resolve the effective `rows` attribute for the rendered <textarea>.
 * Returns `DEFAULT_TEXTAREA_ROWS` when undefined or invalid (≤ 0).
 */
export function resolveRows(rows: number | undefined): number {
  if (rows === undefined) return DEFAULT_TEXTAREA_ROWS;
  if (!Number.isFinite(rows) || rows < 1) return DEFAULT_TEXTAREA_ROWS;
  return Math.floor(rows);
}

/**
 * Compute the next height (in pixels) for an autoResize textarea given the
 * `scrollHeight` reported by the DOM. Returned as a number; runtime applies it
 * via `style.height = `${n}px``. Keeps the math testable without a DOM.
 *
 * Min height honored when scrollHeight is implausible (≤ 0 in jsdom).
 */
export function computeAutoResizeHeight(scrollHeight: number, minHeightPx: number): number {
  if (!Number.isFinite(scrollHeight) || scrollHeight <= 0) return minHeightPx;
  return Math.max(scrollHeight, minHeightPx);
}
