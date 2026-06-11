import type { MultiSelectOption } from "./MultiSelect.schema.js";

/**
 * Returns the list of options that are still available for selection.
 * Filters out options already present in `selected` so they don't appear
 * twice in the dropdown.
 */
export function getAvailableOptions(
  options: ReadonlyArray<MultiSelectOption>,
  selected: ReadonlyArray<string>,
): MultiSelectOption[] {
  const set = new Set(selected);
  return options.filter((opt) => !set.has(opt.value));
}

/**
 * Returns the matching `MultiSelectOption` records for the currently selected
 * values, preserving the order of `selected`. Unknown values are silently
 * dropped (graceful — schema may have shrunk under the field).
 */
export function getSelectedOptions(
  options: ReadonlyArray<MultiSelectOption>,
  selected: ReadonlyArray<string>,
): MultiSelectOption[] {
  const byValue = new Map(options.map((opt) => [opt.value, opt]));
  const out: MultiSelectOption[] = [];
  for (const value of selected) {
    const opt = byValue.get(value);
    if (opt) out.push(opt);
  }
  return out;
}

/**
 * Search filter applied when `searchable=true`. Case-insensitive substring
 * match on both `label` and `value`. Empty query returns the input as-is.
 */
export function filterBySearch(
  options: ReadonlyArray<MultiSelectOption>,
  query: string,
): MultiSelectOption[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [...options];
  return options.filter(
    (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q),
  );
}

/**
 * Adds a value to the selected list, enforcing `maxItems` (when set) and
 * de-duplicating. Returns the same array reference when the value is already
 * present OR the cap is reached — callers can compare identity to detect
 * the no-op.
 */
export function addValue(
  current: ReadonlyArray<string>,
  value: string,
  maxItems?: number,
): string[] {
  if (current.includes(value)) return current as string[];
  if (typeof maxItems === "number" && current.length >= maxItems) return current as string[];
  return [...current, value];
}

/**
 * Removes a value from the selected list. Returns a fresh array even when
 * the value is absent so callers always see a stable shape.
 */
export function removeValue(current: ReadonlyArray<string>, value: string): string[] {
  return current.filter((v) => v !== value);
}

/**
 * True when the cap is reached. Used to gate further selections AND to
 * announce the locked state to the dropdown trigger via `aria-disabled`
 * semantics (the trigger itself stays focusable to preserve removal flows).
 */
export function isAtMaxItems(
  current: ReadonlyArray<string>,
  maxItems: number | undefined,
): boolean {
  return typeof maxItems === "number" && current.length >= maxItems;
}
