/**
 * Pure helpers for FieldArray. Runtime-agnostic — covers ARIA id generation
 * and aria-label conventions used by the React + Preact runtimes.
 *
 * `useFieldArray` itself is a thin wrapper around RHF's hook (live in the
 * runtime layer) — these helpers are the cross-runtime contract that the
 * wrapper and Storybook stories share.
 */

/** Default aria-label for the wrapping list element. */
export function buildListAriaLabel(name: string): string {
  return `${name} items`;
}

/** Default aria-label for the per-item Remove button. */
export function buildRemoveAriaLabel(name: string, index: number): string {
  return `Remove ${name} item ${index + 1}`;
}

/** Default aria-label for the Add button (consumer-rendered). */
export function buildAddAriaLabel(name: string): string {
  return `Add ${name} item`;
}

/**
 * After removing item at `removedIndex` from an array of `previousLength`
 * items, return the index that should receive focus. Clamps to the last
 * remaining index, or `-1` if the list became empty.
 */
export function nextFocusIndexAfterRemove(previousLength: number, removedIndex: number): number {
  if (previousLength <= 1) return -1;
  const newLength = previousLength - 1;
  return Math.min(removedIndex, newLength - 1);
}
