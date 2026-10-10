// RED stub.
export type BoardDisplayMode = "inline" | "fullscreen" | "pip";
export type BoardLayout = "board" | "summary";
export function layoutForDisplayMode(_mode: BoardDisplayMode): BoardLayout {
  return "board";
}
export interface DealLike {
  amount?: string;
}
export function stageSummary(_deals: readonly DealLike[]): { count: number; total: string | undefined } {
  return { count: 0, total: undefined };
}
export const SUMMARY_STAGE_LIMIT = 0;
