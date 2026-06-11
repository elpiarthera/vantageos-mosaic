/**
 * RadioGroup.logic.ts — pure, framework-agnostic logic.
 * No JSX here — shared between React 19 and Preact 10 runtimes.
 *
 * WCAG-AA ARIA + roving tabindex spec (WAI-ARIA Authoring Practices §3.10):
 *
 *   - role="radiogroup" on container
 *   - role="radio" + aria-checked on each radio
 *   - aria-labelledby on container points to the visible group label id
 *   - aria-labelledby on each radio points to its own option label span id
 *   - aria-describedby on a radio points to its description span id (if present)
 *   - Roving tabindex:
 *       * If a value is selected → the SELECTED radio has tabIndex 0, all
 *         others tabIndex -1.
 *       * If nothing is selected → the FIRST enabled radio has tabIndex 0,
 *         all others tabIndex -1 (so Tab can enter the group).
 *   - Arrow keys (Up/Down vertical, Left/Right horizontal) MOVE focus to the
 *     next/previous enabled radio AND select it (focus + selection sync — this
 *     is the radiogroup pattern, distinct from tabs).
 *   - Home / End jump to first / last enabled radio AND select it.
 *   - Space / Enter on a non-selected focused radio selects it (no-op when
 *     already selected).
 *   - Disabled radios are skipped during arrow nav (findNextEnabledIndex).
 */

import type { RadioGroupOption } from "./RadioGroup.schema.js";

export type RadioOrientation = "vertical" | "horizontal";

/**
 * Returns the prev/next key pair for the given orientation.
 *
 * Vertical group → ArrowUp/ArrowDown.
 * Horizontal group → ArrowLeft/ArrowRight.
 *
 * (Per WAI-ARIA radiogroup pattern, only one axis is used; the perpendicular
 * arrow keys are NOT intercepted — they let the user move out of the group.)
 */
export function getNavKeys(orientation: RadioOrientation): {
  prev: string;
  next: string;
} {
  return orientation === "vertical"
    ? { prev: "ArrowUp", next: "ArrowDown" }
    : { prev: "ArrowLeft", next: "ArrowRight" };
}

/**
 * Finds the next enabled (non-disabled) option index in `direction`,
 * wrapping around at boundaries. Returns `currentIndex` if every option
 * is disabled (defensive — Zod schema requires options.length ≥ 1 but does
 * not forbid all-disabled).
 */
export function findNextEnabledIndex(
  options: Array<Pick<RadioGroupOption, "disabled">>,
  currentIndex: number,
  direction: 1 | -1,
): number {
  const len = options.length;
  if (len === 0) return currentIndex;
  let i = (currentIndex + direction + len) % len;
  for (let tries = 0; tries < len; tries++) {
    if (!options[i]?.disabled) return i;
    i = (i + direction + len) % len;
  }
  return currentIndex;
}

/** First enabled option index, or 0 if all are disabled. */
export function findFirstEnabledIndex(
  options: Array<Pick<RadioGroupOption, "disabled">>,
): number {
  const idx = options.findIndex((o) => !o.disabled);
  return idx === -1 ? 0 : idx;
}

/** Last enabled option index, or `options.length - 1` if all are disabled. */
export function findLastEnabledIndex(
  options: Array<Pick<RadioGroupOption, "disabled">>,
): number {
  for (let i = options.length - 1; i >= 0; i--) {
    if (!options[i]?.disabled) return i;
  }
  return options.length - 1;
}

/**
 * Returns the index of the option whose `value` matches `selectedValue`,
 * or -1 if no option is selected (or the selected value points to a disabled
 * option — selected-but-disabled is a valid state, so we DON'T filter here).
 */
export function findSelectedIndex(
  options: Array<Pick<RadioGroupOption, "value">>,
  selectedValue: string | undefined,
): number {
  if (selectedValue === undefined || selectedValue === "") return -1;
  return options.findIndex((o) => o.value === selectedValue);
}

/**
 * Roving tabindex resolver — returns the index that should carry tabIndex=0.
 *
 *   - If something is selected → the selected index (focus follows selection).
 *   - Otherwise → the first enabled option (so Tab can enter the group).
 */
export function getRovingTabIndex(
  options: Array<Pick<RadioGroupOption, "value" | "disabled">>,
  selectedValue: string | undefined,
): number {
  const selectedIdx = findSelectedIndex(options, selectedValue);
  if (selectedIdx >= 0) return selectedIdx;
  return findFirstEnabledIndex(options);
}

/** Stable DOM id for the group label (linked by container aria-labelledby). */
export function getGroupLabelId(instanceId: string, name: string): string {
  return `${instanceId}-${name}-label`;
}

/** Stable DOM id for an option label span (linked by radio aria-labelledby). */
export function getOptionLabelId(
  instanceId: string,
  name: string,
  optionValue: string,
): string {
  return `${instanceId}-${name}-${optionValue}-label`;
}

/** Stable DOM id for an option description span (linked by radio aria-describedby). */
export function getOptionDescriptionId(
  instanceId: string,
  name: string,
  optionValue: string,
): string {
  return `${instanceId}-${name}-${optionValue}-desc`;
}

/** Tailwind classes for the root radiogroup container. */
export function getGroupClasses(orientation: RadioOrientation): string {
  return orientation === "vertical"
    ? "flex flex-col gap-2"
    : "flex flex-row flex-wrap gap-4";
}

/** Tailwind classes for a single radio row (label + control + description). */
export function getOptionRowClasses(
  isDisabled: boolean,
  orientation: RadioOrientation,
): string {
  const base = "flex items-start gap-2";
  const orient = orientation === "vertical" ? "flex-row" : "flex-row";
  const state = isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  return [base, orient, state].join(" ");
}

/** Tailwind classes for the visible radio control (the round dot). */
export function getRadioControlClasses(
  isSelected: boolean,
  isDisabled: boolean,
): string {
  const base =
    "inline-flex items-center justify-center w-4 h-4 mt-0.5 rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shrink-0";
  const state = isDisabled
    ? "border-slate-300 bg-slate-100"
    : isSelected
      ? "border-blue-600 bg-white"
      : "border-slate-400 bg-white hover:border-slate-600";
  return [base, state].join(" ");
}

/** Whether a keyboard event should activate the focused radio (Space / Enter). */
export function isActivationKey(key: string): boolean {
  return key === " " || key === "Space" || key === "Enter";
}
