/** Timeline pure logic (no React): which steps an inline (compact) card shows. */
export type StepStatus = "done" | "current" | "pending" | "blocked";

export interface StepLike {
  status: StepStatus;
}

/**
 * Compact (Claude inline card: collapsed to the current step and the next one, no drill-in)
 * keeps the current step and its successor. With no current step it anchors on the first
 * unfinished one; with everything done, on the last step. Not compact: every step.
 */
export function visibleSteps<T extends StepLike>(
  steps: readonly T[],
  compact: boolean,
): { visible: T[]; hiddenBefore: number; hiddenAfter: number } {
  if (!compact || steps.length === 0) {
    return { visible: [...steps], hiddenBefore: 0, hiddenAfter: 0 };
  }
  let anchor = steps.findIndex((s) => s.status === "current");
  if (anchor < 0) anchor = steps.findIndex((s) => s.status !== "done");
  if (anchor < 0) anchor = steps.length - 1;
  const end = Math.min(anchor + 2, steps.length);
  return {
    visible: steps.slice(anchor, end),
    hiddenBefore: anchor,
    hiddenAfter: steps.length - end,
  };
}
