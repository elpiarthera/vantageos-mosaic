/**
 * T3-C — mosaic-tokens coherence test.
 *
 * Enforces invariants between tokens.ts (JS) and tokens.css (CSS) plus
 * ordering / scale constraints documented in tokens.ts. Failure to
 * maintain parity is a ship-blocker because consumers can opt for either
 * surface (CSS-only via Tailwind v4 or JS-only via runtime imports) and
 * must see the same value set on both sides.
 *
 * Naming bridge: JS key `<cat>-<rest>` <==> CSS var `--mosaic-<jsCat>-<rest>`,
 * where jsCat remaps category names to their CSS prefix:
 *   colors      -> color
 *   spacing     -> space
 *   typography  -> mixed (text / lh / fw) — see mapTypographyKey()
 *   shadows     -> shadow
 *   radii       -> radius
 *   motion      -> mixed (duration / easing) — see mapMotionKey()
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colors, motion, radii, shadows, spacing, typography } from "../tokens";

const CSS_PATH = join(import.meta.dirname, "..", "tokens.css");
const cssSource = readFileSync(CSS_PATH, "utf-8");

function collectCssVars(prefix: string): Set<string> {
  const re = new RegExp(`--mosaic-${prefix}-([\\w-]+):`, "g");
  const out = new Set<string>();
  for (const m of cssSource.matchAll(re)) {
    const key = m[1];
    if (key !== undefined) out.add(key);
  }
  return out;
}

function mapTypographyKey(k: string): { cssPrefix: string; cssKey: string } {
  if (k.startsWith("size-")) return { cssPrefix: "text", cssKey: k.slice(5) };
  if (k.startsWith("lh-")) return { cssPrefix: "lh", cssKey: k.slice(3) };
  if (k.startsWith("weight-")) return { cssPrefix: "fw", cssKey: k.slice(7) };
  throw new Error(`Unmapped typography key: ${k}`);
}

function mapMotionKey(k: string): { cssPrefix: string; cssKey: string } {
  if (k.startsWith("duration-")) return { cssPrefix: "duration", cssKey: k.slice(9) };
  if (k.startsWith("easing-")) return { cssPrefix: "easing", cssKey: k.slice(7) };
  throw new Error(`Unmapped motion key: ${k}`);
}

describe("mosaic-tokens / coherence", () => {
  it("colors — every JS key has a matching --mosaic-color-<key> CSS var", () => {
    const css = collectCssVars("color");
    for (const k of Object.keys(colors)) expect(css.has(k), `missing CSS --mosaic-color-${k}`).toBe(true);
    expect(css.size).toBe(Object.keys(colors).length);
  });

  it("spacing — every JS key has a matching --mosaic-space-<key> CSS var", () => {
    const css = collectCssVars("space");
    for (const k of Object.keys(spacing)) expect(css.has(k), `missing CSS --mosaic-space-${k}`).toBe(true);
    expect(css.size).toBe(Object.keys(spacing).length);
  });

  it("typography — every JS key maps to a CSS var under text/lh/fw prefixes", () => {
    const text = collectCssVars("text");
    const lh = collectCssVars("lh");
    const fw = collectCssVars("fw");
    for (const k of Object.keys(typography)) {
      const { cssPrefix, cssKey } = mapTypographyKey(k);
      const pool = cssPrefix === "text" ? text : cssPrefix === "lh" ? lh : fw;
      expect(pool.has(cssKey), `missing CSS --mosaic-${cssPrefix}-${cssKey}`).toBe(true);
    }
    expect(text.size + lh.size + fw.size).toBe(Object.keys(typography).length);
  });

  it("shadows — every JS key has a matching --mosaic-shadow-<key> CSS var", () => {
    const css = collectCssVars("shadow");
    for (const k of Object.keys(shadows)) expect(css.has(k), `missing CSS --mosaic-shadow-${k}`).toBe(true);
    expect(css.size).toBe(Object.keys(shadows).length);
  });

  it("radii — every JS key has a matching --mosaic-radius-<key> CSS var", () => {
    const css = collectCssVars("radius");
    for (const k of Object.keys(radii)) expect(css.has(k), `missing CSS --mosaic-radius-${k}`).toBe(true);
    expect(css.size).toBe(Object.keys(radii).length);
  });

  it("motion — every JS key maps to a CSS var under duration/easing prefixes", () => {
    const dur = collectCssVars("duration");
    const ease = collectCssVars("easing");
    for (const k of Object.keys(motion)) {
      const { cssPrefix, cssKey } = mapMotionKey(k);
      const pool = cssPrefix === "duration" ? dur : ease;
      expect(pool.has(cssKey), `missing CSS --mosaic-${cssPrefix}-${cssKey}`).toBe(true);
    }
    expect(dur.size + ease.size).toBe(Object.keys(motion).length);
  });
});

describe("mosaic-tokens / scale invariants", () => {
  function pxToNumber(v: string): number {
    const n = Number.parseFloat(v.replace("px", ""));
    if (!Number.isFinite(n)) throw new Error(`not a px value: ${v}`);
    return n;
  }

  function assertAscending(values: number[]): void {
    for (let i = 1; i < values.length; i++) {
      const cur = values[i];
      const prev = values[i - 1];
      if (cur === undefined || prev === undefined) throw new Error(`unexpected undefined at index ${i}`);
      expect(cur).toBeGreaterThan(prev);
    }
  }

  function requireToken(record: Readonly<Record<string, string>>, key: string): string {
    const v = record[key];
    if (v === undefined) throw new Error(`missing token: ${key}`);
    return v;
  }

  it("spacing — strictly ascending", () => {
    assertAscending(Object.values(spacing).map(pxToNumber));
  });

  it("typography size — strictly ascending (xs → 3xl)", () => {
    const sizeKeys = ["size-xs", "size-sm", "size-base", "size-lg", "size-xl", "size-2xl", "size-3xl"] as const;
    assertAscending(sizeKeys.map((k) => pxToNumber(requireToken(typography, k))));
  });

  it("radii — strictly ascending (none → full)", () => {
    const radKeys = ["none", "xs", "sm", "md", "lg", "xl", "full"] as const;
    assertAscending(radKeys.map((k) => pxToNumber(requireToken(radii, k))));
  });

  it("color shades — present for all 5 statuses with 50/500/700 triplets", () => {
    const statuses = ["success", "warning", "danger", "info", "neutral"];
    const shades = ["50", "500", "700"];
    for (const s of statuses) {
      for (const sh of shades) {
        const key = `${s}-${sh}`;
        expect(colors[key], `missing color ${key}`).toMatch(/^oklch\(/);
      }
    }
  });
});
