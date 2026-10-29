import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type MosaicI18nKey, t } from "../i18n/strings";

/**
 * FR/EN parity for the config views. The key set is DERIVED from the canonical locale files
 * (never listed here): every key under the view prefixes must exist in both languages, be
 * non-empty, and be mirrored verbatim in the inlined `strings.ts` table.
 */
const LOCALES = join(import.meta.dirname, "..", "..", "..", "mosaic-i18n", "src", "locales");
const PREFIXES = ["ConfigView.", "ConfigList.", "ConfigDetail.", "DetailView."];

function flatten(o: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") out[p] = v;
      else Object.assign(out, flatten(v, p));
    }
  }
  return out;
}
const read = (f: string) => flatten(JSON.parse(readFileSync(join(LOCALES, f), "utf8")));
const en = read("en.json");
const fr = read("fr.json");
const scoped = (m: Record<string, string>) =>
  Object.keys(m)
    .filter((k) => PREFIXES.some((p) => k.startsWith(p)))
    .sort();

describe("config view i18n parity", () => {
  it("finds keys for every prefix (positive control)", () => {
    for (const p of PREFIXES) expect(scoped(en).some((k) => k.startsWith(p))).toBe(true);
  });
  it("EN and FR carry exactly the same keys", () => {
    expect(scoped(fr)).toEqual(scoped(en));
  });
  it("no empty value, and FR differs from EN for user-facing prose", () => {
    for (const k of scoped(en)) {
      expect((en[k] ?? "").length).toBeGreaterThan(0);
      expect((fr[k] ?? "").length).toBeGreaterThan(0);
    }
    expect(fr["ConfigList.paging.more"]).not.toBe(en["ConfigList.paging.more"]);
  });
  it("strings.ts mirrors the locale files verbatim in both languages", () => {
    for (const k of scoped(en)) {
      expect(t(k as MosaicI18nKey, "en")).toBe(en[k]);
      expect(t(k as MosaicI18nKey, "fr")).toBe(fr[k]);
    }
  });
});
