/**
 * Reads a dotted path (`a.b.0.c`) from plain data. Own properties only: the prototype chain is
 * never walked, so `constructor` or `__proto__` read as absent. Returns `undefined` for anything
 * missing; callers decide whether absence is an error.
 */
export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    // Arrays expose `length` as an own property: it is not data, so only index keys read.
    if (Array.isArray(cur) && !/^\d+$/.test(key)) return undefined;
    if (!Object.hasOwn(cur, key)) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
