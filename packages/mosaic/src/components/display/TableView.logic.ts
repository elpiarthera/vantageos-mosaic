/**
 * TableView pure logic (R01 / R10): sorting, selection and cell-kind rules. No React, no DOM.
 * Shared by the React and Preact runtimes through the shared TableView implementation.
 */
export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

/** How a column's cells are compared and rendered. */
export type ColumnKind = "text" | "number" | "amount" | "icon";

export type SelectionMode = "none" | "single" | "multiple";

/** `null`, `undefined` and the empty string carry no value: they sort last in both directions. */
export function isMissing(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

const DECIMAL = /^(-)?(\d+)(?:\.(\d+))?$/;

function parseDecimal(s: string): { neg: boolean; int: string; frac: string } | undefined {
  const m = DECIMAL.exec(s.trim());
  if (!m) return undefined;
  const int = (m[2] ?? "0").replace(/^0+(?=\d)/, "");
  const frac = (m[3] ?? "").replace(/0+$/, "");
  const zero = int === "0" && frac === "";
  return { neg: m[1] === "-" && !zero, int, frac };
}

/**
 * Exact comparison of decimal strings (token amounts): no Number() round trip, so values
 * beyond 2^53 or with 18 decimals compare correctly. Unparseable input compares as equal.
 */
export function compareDecimalStrings(a: string, b: string): number {
  const x = parseDecimal(a);
  const y = parseDecimal(b);
  if (!x || !y) return 0;
  if (x.neg !== y.neg) return x.neg ? -1 : 1;
  const sign = x.neg ? -1 : 1;
  if (x.int.length !== y.int.length) return sign * (x.int.length < y.int.length ? -1 : 1);
  if (x.int !== y.int) return sign * (x.int < y.int ? -1 : 1);
  const len = Math.max(x.frac.length, y.frac.length);
  const fx = x.frac.padEnd(len, "0");
  const fy = y.frac.padEnd(len, "0");
  if (fx === fy) return 0;
  return sign * (fx < fy ? -1 : 1);
}

const collators = new Map<string, Intl.Collator>();
function collator(locale: string): Intl.Collator {
  let c = collators.get(locale);
  if (!c) {
    c = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
    collators.set(locale, c);
  }
  return c;
}

/** Ascending comparison of two non-missing cell values for a column kind. */
export function compareCells(a: unknown, b: unknown, kind: ColumnKind, locale: string): number {
  if (kind === "amount") return compareDecimalStrings(String(a), String(b));
  if (kind === "number") {
    const x = Number(a);
    const y = Number(b);
    if (Number.isNaN(x) || Number.isNaN(y)) return collator(locale).compare(String(a), String(b));
    return x === y ? 0 : x < y ? -1 : 1;
  }
  return collator(locale).compare(String(a), String(b));
}

/** Stable sort; missing values last in both directions. Never mutates `items`. */
export function sortItems<T>(
  items: readonly T[],
  getValue: (item: T) => unknown,
  kind: ColumnKind,
  direction: SortDirection,
  locale: string,
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return items
    .map((item, index) => ({ item, index, value: getValue(item) }))
    .sort((p, q) => {
      const pm = isMissing(p.value);
      const qm = isMissing(q.value);
      if (pm || qm) return pm && qm ? p.index - q.index : pm ? 1 : -1;
      const c = compareCells(p.value, q.value, kind, locale);
      return c !== 0 ? sign * c : p.index - q.index;
    })
    .map((e) => e.item);
}

/** Header click cycle on a column: none -> asc -> desc -> none; another column restarts at asc. */
export function nextSort(current: SortState | undefined, key: string): SortState | undefined {
  if (!current || current.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : undefined;
}

export function toggleSelection(
  current: ReadonlySet<string>,
  key: string,
  mode: SelectionMode,
): Set<string> {
  if (mode === "none") return new Set(current);
  if (mode === "single") return current.has(key) ? new Set() : new Set([key]);
  const next = new Set(current);
  if (!next.delete(key)) next.add(key);
  return next;
}

export function toggleAll(current: ReadonlySet<string>, allKeys: readonly string[]): Set<string> {
  return allKeys.length > 0 && allKeys.every((k) => current.has(k)) ? new Set() : new Set(allKeys);
}
