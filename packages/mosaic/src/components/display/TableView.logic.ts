// RED stub: behaviour lands in the next commit.
export type SortDirection = "asc" | "desc";
export interface SortState {
  key: string;
  direction: SortDirection;
}
export type ColumnKind = "text" | "number" | "amount" | "icon";
export type SelectionMode = "none" | "single" | "multiple";
export function isMissing(_v: unknown): boolean {
  return false;
}
export function compareDecimalStrings(_a: string, _b: string): number {
  return 0;
}
export function compareCells(_a: unknown, _b: unknown, _kind: ColumnKind, _locale: string): number {
  return 0;
}
export function sortItems<T>(
  items: readonly T[],
  _getValue: (item: T) => unknown,
  _kind: ColumnKind,
  _direction: SortDirection,
  _locale: string,
): T[] {
  return [...items];
}
export function nextSort(_current: SortState | undefined, _key: string): SortState | undefined {
  return undefined;
}
export function toggleSelection(
  current: ReadonlySet<string>,
  _key: string,
  _mode: SelectionMode,
): Set<string> {
  return new Set(current);
}
export function toggleAll(current: ReadonlySet<string>, _allKeys: readonly string[]): Set<string> {
  return new Set(current);
}
