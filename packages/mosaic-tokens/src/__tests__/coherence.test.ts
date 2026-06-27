/**
 * mosaic-tokens coherence test — v0.3.0 (anydebate design language).
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
 *   typography  -> mixed (text / lh / fw / font) — see mapTypographyKey()
 *   shadows     -> shadow
 *   radii       -> radius
 *   motion      -> mixed (duration / easing) — see mapMotionKey()
 *
 * v0.3.0 additions:
 *   - Additive color keys (background, foreground, card, popover, primary,
 *     secondary, muted, accent, destructive, border, input, ring + foregrounds)
 *   - Font family keys (font-sans, font-mono) under --mosaic-font-*
 *   - New motion key: duration-slower
 *   - Snapshot test: anydebate OKLCH palette fingerprint
 *   - Dark-mode presence test: .dark overrides present in CSS
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colors, motion, radii, shadows, spacing, typography } from "../tokens";

const CSS_PATH = join(import.meta.dirname, "..", "tokens.css");
const cssSource = readFileSync(CSS_PATH, "utf-8");

function collectCssVars(prefix: string): Set<string> {
  // Collect from both :root and .dark blocks
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
  if (k.startsWith("font-")) return { cssPrefix: "font", cssKey: k.slice(5) };
  throw new Error(`Unmapped typography key: ${k}`);
}

function mapMotionKey(k: string): { cssPrefix: string; cssKey: string } {
  if (k.startsWith("duration-")) return { cssPrefix: "duration", cssKey: k.slice(9) };
  if (k.startsWith("easing-")) return { cssPrefix: "easing", cssKey: k.slice(7) };
  throw new Error(`Unmapped motion key: ${k}`);
}

describe("mosaic-tokens / coherence", () => {
  it("colors — every JS key has a matching --mosaic-color-<key> CSS var (light + dark)", () => {
    const css = collectCssVars("color");
    for (const k of Object.keys(colors))
      expect(css.has(k), `missing CSS --mosaic-color-${k}`).toBe(true);
  });

  it("spacing — every JS key has a matching --mosaic-space-<key> CSS var", () => {
    const css = collectCssVars("space");
    for (const k of Object.keys(spacing))
      expect(css.has(k), `missing CSS --mosaic-space-${k}`).toBe(true);
    expect(css.size).toBe(Object.keys(spacing).length);
  });

  it("typography — every JS key maps to a CSS var under text/lh/fw/font prefixes", () => {
    const text = collectCssVars("text");
    const lh = collectCssVars("lh");
    const fw = collectCssVars("fw");
    const font = collectCssVars("font");
    for (const k of Object.keys(typography)) {
      const { cssPrefix, cssKey } = mapTypographyKey(k);
      const pool =
        cssPrefix === "text" ? text : cssPrefix === "lh" ? lh : cssPrefix === "fw" ? fw : font;
      expect(pool.has(cssKey), `missing CSS --mosaic-${cssPrefix}-${cssKey}`).toBe(true);
    }
    expect(text.size + lh.size + fw.size + font.size).toBe(Object.keys(typography).length);
  });

  it("shadows — every JS key has a matching --mosaic-shadow-<key> CSS var", () => {
    const css = collectCssVars("shadow");
    for (const k of Object.keys(shadows))
      expect(css.has(k), `missing CSS --mosaic-shadow-${k}`).toBe(true);
    expect(css.size).toBe(Object.keys(shadows).length);
  });

  it("radii — every JS key has a matching --mosaic-radius-<key> CSS var", () => {
    const css = collectCssVars("radius");
    for (const k of Object.keys(radii))
      expect(css.has(k), `missing CSS --mosaic-radius-${k}`).toBe(true);
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
      if (cur === undefined || prev === undefined)
        throw new Error(`unexpected undefined at index ${i}`);
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
    const sizeKeys = [
      "size-xs",
      "size-sm",
      "size-base",
      "size-lg",
      "size-xl",
      "size-2xl",
      "size-3xl",
    ] as const;
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

  it("motion durations — strictly ascending (fast → slow → slower)", () => {
    const durationKeys = [
      "duration-fast",
      "duration-base",
      "duration-slow",
      "duration-slower",
    ] as const;
    const msValues = durationKeys.map((k) => {
      const v = requireToken(motion, k);
      const n = Number.parseFloat(v.replace("ms", ""));
      if (!Number.isFinite(n)) throw new Error(`not a ms value: ${v}`);
      return n;
    });
    assertAscending(msValues);
  });
});

describe("mosaic-tokens / anydebate palette snapshot", () => {
  it("primary blue accent (info-500) matches anydebate oklch(0.7 0.15 240)", () => {
    expect(colors["info-500"]).toBe("oklch(0.700 0.150 240)");
  });

  it("destructive matches anydebate oklch(0.577 0.245 27)", () => {
    expect(colors["danger-500"]).toBe("oklch(0.577 0.245 27)");
    expect(colors.destructive).toBe("oklch(0.577 0.245 27)");
  });

  it("anydebate light background/foreground present", () => {
    expect(colors.background).toBe("oklch(0.980 0 0)");
    expect(colors.foreground).toBe("oklch(0.150 0 0)");
  });

  it('dark mode overrides declared in CSS ([data-theme="dark"] — mosaic-blocks ecosystem convention)', () => {
    expect(cssSource).toContain('[data-theme="dark"] {');
    // Ensure the anydebate .dark selector was NOT copied verbatim (would fragment dark-mode toggling)
    expect(cssSource).not.toContain(".dark {");
    expect(cssSource).toContain("--mosaic-color-background: oklch(0.04 0 0)");
    expect(cssSource).toContain("--mosaic-color-primary: oklch(0.7 0.15 240)");
  });

  it("anydebate base radius (lg=12px) matches source --radius: 0.75rem", () => {
    expect(radii.lg).toBe("12px");
  });

  it("Inter font family declared in typography", () => {
    expect(typography["font-sans"]).toContain("Inter");
  });

  it("all semantic UI color slots present (additive anydebate keys)", () => {
    const slots = [
      "background",
      "foreground",
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
      "destructive",
      "destructive-foreground",
      "border",
      "input",
      "ring",
    ];
    for (const slot of slots) {
      expect(colors[slot], `missing semantic color slot: ${slot}`).toMatch(/^oklch\(/);
    }
  });

  it("duration-slower (additive key) is 500ms", () => {
    expect(motion["duration-slower"]).toBe("500ms");
  });

  it("0.2.1 backward-compatible keys all present in colors", () => {
    const v021Keys = [
      "success-50",
      "success-500",
      "success-700",
      "warning-50",
      "warning-500",
      "warning-700",
      "danger-50",
      "danger-500",
      "danger-700",
      "info-50",
      "info-500",
      "info-700",
      "neutral-50",
      "neutral-500",
      "neutral-700",
    ];
    for (const k of v021Keys) {
      expect(colors[k], `0.2.1 compat missing: ${k}`).toMatch(/^oklch\(/);
    }
  });
});
