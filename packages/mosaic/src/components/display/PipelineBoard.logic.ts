/** PipelineBoard pure logic (no React). */
import { sumDecimalStrings } from "../shared/decimal.js";

export type BoardDisplayMode = "inline" | "fullscreen" | "pip";
export type BoardLayout = "board" | "summary";

/**
 * Fullscreen-first: Claude allows the board only fullscreen (inline = stage totals, within the
 * 4-5 data-point cap) and ChatGPT opens entrypoints fullscreen. Inline and pip get the summary.
 */
export function layoutForDisplayMode(mode: BoardDisplayMode): BoardLayout {
  return mode === "fullscreen" ? "board" : "summary";
}

export interface DealLike {
  amount?: string;
}

/**
 * Deal count and exact total of a stage. Deals without an amount are counted but not summed; an
 * amount that is not a decimal string makes the total `undefined` (shown as unknown, never a
 * partial sum presented as the total).
 */
export function stageSummary(deals: readonly DealLike[]): {
  count: number;
  total: string | undefined;
} {
  const amounts = deals.flatMap((d) => (d.amount === undefined ? [] : [d.amount]));
  return { count: deals.length, total: sumDecimalStrings(amounts) };
}

/** Claude inline card guideline: at most 4-5 data points, so at most 5 stages in the summary. */
export const SUMMARY_STAGE_LIMIT = 5;
