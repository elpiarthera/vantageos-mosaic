/**
 * Test helper: a deep clone of `base` with ONE dotted path (array indexes allowed) set to `value`,
 * or removed with `REMOVE`. A path whose parent does not exist throws, so a mutation that did not
 * land can never be read as a pass.
 */
export const REMOVE = Symbol("remove");
type Obj = Record<string, unknown>;

export function mutated(base: unknown, path: string, value: unknown): Obj {
  const root = JSON.parse(JSON.stringify(base)) as Obj;
  const keys = path.split(".");
  let cur: Obj = root;
  for (const k of keys.slice(0, -1)) {
    const next = cur[k];
    if (next === null || typeof next !== "object")
      throw new Error(`mutation path misses at "${k}"`);
    cur = next as Obj;
  }
  const last = keys[keys.length - 1] as string;
  if (!(last in cur) && value === REMOVE) throw new Error(`nothing to remove at "${path}"`);
  if (value === REMOVE) Reflect.deleteProperty(cur, last);
  else cur[last] = value;
  return root;
}
