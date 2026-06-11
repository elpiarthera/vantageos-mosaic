/**
 * Select.logic.ts — pure, framework-agnostic logic for the Select primitive.
 * Shared between React 19 and Preact 10 runtimes.
 *
 * WCAG-AA Combobox-with-listbox-popup pattern (APG 2024):
 * - Trigger: role=combobox + aria-haspopup=listbox + aria-expanded + aria-controls
 * - Popup:   role=listbox  + aria-activedescendant pointing at active option
 * - Option:  role=option   + aria-selected=true on the selected one
 * - Keyboard:
 *     ArrowDown → next enabled option (wrap)
 *     ArrowUp   → prev enabled option (wrap)
 *     Home      → first enabled option
 *     End       → last enabled option
 *     Enter     → commit active option, close popup
 *     Esc       → close popup, restore value, focus trigger
 *     Printable type-ahead → jump to first option whose label starts with the buffer
 */

import type { SelectOption } from "./Select.schema.js";

export function getTriggerId(instanceId: string): string {
  return `${instanceId}-trigger`;
}
export function getListboxId(instanceId: string): string {
  return `${instanceId}-listbox`;
}
export function getOptionId(instanceId: string, value: string): string {
  return `${instanceId}-opt-${value}`;
}

/**
 * Filters options by case-insensitive substring on `label`. Empty query → all.
 * Disabled flags are preserved (they're still rendered, just not selectable).
 */
export function filterOptions(options: SelectOption[], query: string): SelectOption[] {
  const q = query.trim().toLowerCase();
  if (q === "") return options;
  return options.filter((o) => o.label.toLowerCase().includes(q));
}

/**
 * Finds the index of the option with `value`, or -1.
 */
export function indexOfValue(options: SelectOption[], value: string | null | undefined): number {
  if (value == null) return -1;
  return options.findIndex((o) => o.value === value);
}

/**
 * Walk forward/backward to the next enabled option, wrapping. Returns -1
 * if no enabled option exists (defensive — schema requires min(1)).
 */
export function findNextEnabledIndex(
  options: SelectOption[],
  startIndex: number,
  direction: 1 | -1,
): number {
  const len = options.length;
  if (len === 0) return -1;
  let i = startIndex;
  for (let tries = 0; tries < len; tries++) {
    i = (i + direction + len) % len;
    if (!options[i]?.disabled) return i;
  }
  return -1;
}

export function findFirstEnabledIndex(options: SelectOption[]): number {
  const idx = options.findIndex((o) => !o.disabled);
  return idx === -1 ? -1 : idx;
}

export function findLastEnabledIndex(options: SelectOption[]): number {
  for (let i = options.length - 1; i >= 0; i--) {
    if (!options[i]?.disabled) return i;
  }
  return -1;
}

/**
 * Type-ahead: given a buffer string, find first option whose label starts with
 * the buffer (case-insensitive). Skips disabled options.
 */
export function findByTypeAhead(options: SelectOption[], buffer: string): number {
  if (buffer === "") return -1;
  const needle = buffer.toLowerCase();
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    if (!o || o.disabled) continue;
    if (o.label.toLowerCase().startsWith(needle)) return i;
  }
  return -1;
}

/**
 * Tailwind class for the trigger button.
 */
export function getTriggerClasses(isDisabled: boolean, isOpen: boolean): string {
  const base =
    "inline-flex items-center justify-between gap-2 w-full rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
  const state = isDisabled
    ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
    : isOpen
      ? "border-blue-600 bg-white text-slate-900"
      : "border-slate-300 bg-white text-slate-900 hover:border-slate-400";
  return `${base} ${state}`;
}

export function getListboxClasses(): string {
  return "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg focus:outline-none";
}

export function getOptionClasses(
  isActive: boolean,
  isSelected: boolean,
  isDisabled: boolean,
): string {
  const base = "flex items-center px-3 py-2 text-sm select-none";
  if (isDisabled) return `${base} text-slate-400 cursor-not-allowed`;
  const active = isActive ? "bg-blue-50 text-blue-900" : "text-slate-900";
  const selected = isSelected ? "font-medium" : "";
  return `${base} ${active} ${selected} cursor-pointer`;
}

export function getSearchInputClasses(): string {
  return "w-full px-3 py-2 text-sm border-b border-slate-200 focus:outline-none focus:border-blue-600";
}

/**
 * Resolves the label of the currently selected option for display in the trigger.
 * Returns null when no value selected (caller shows placeholder).
 */
export function resolveSelectedLabel(
  options: SelectOption[],
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const o = options.find((opt) => opt.value === value);
  return o?.label ?? null;
}
