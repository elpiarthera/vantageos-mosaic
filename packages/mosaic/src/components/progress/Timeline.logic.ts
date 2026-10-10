// RED stub.
export type StepStatus = "done" | "current" | "pending" | "blocked";
export interface StepLike {
  status: StepStatus;
}
export function visibleSteps<T extends StepLike>(
  steps: readonly T[],
  _compact: boolean,
): { visible: T[]; hiddenBefore: number; hiddenAfter: number } {
  return { visible: [...steps], hiddenBefore: 0, hiddenAfter: 0 };
}
