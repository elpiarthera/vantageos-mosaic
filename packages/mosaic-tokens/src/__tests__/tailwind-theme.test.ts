/**
 * mosaic-tokens Tailwind v4 `@theme` surface — RED/GREEN compilation proof +
 * drift/duplication/negative-pole/unknown-category guards.
 *
 * Tailwind v4 does not derive utilities from an ordinary `:root` block; it
 * needs an `@theme` block. `scripts/derive-tailwind-theme.mjs` generates
 * `src/theme.css` from `src/tokens.css` for exactly that reason (see its
 * docstring for the full category -> namespace mapping and the sentinel
 * rationale). This suite compiles REAL Tailwind v4 (`tailwindcss@4.1.8`,
 * the package's own devDependency) against the package's own CSS files —
 * no simulation, no hand-rolled approximation of what Tailwind does.
 *
 * Scope boundary on the negative-pole (sentinel) tests: this suite proves
 * the sentinel fallback is PRESENT and WIRED in the compiled cascade (the
 * `--color-danger-500: var(--mosaic-color-danger-500, <sentinel>);`
 * declaration exists and `.bg-danger-500` references that theme variable).
 * It does NOT observe the final step — an undefined custom property
 * resolving to its fallback at computed-value time — because that step
 * requires a browser (or an equivalent CSS custom-property engine) to
 * actually render, and no browser renders in this suite. That resolution
 * behavior is defined by the CSS Custom Properties spec's two-argument
 * `var()` form; it is named here rather than asserted, per the same
 * discipline this suite otherwise enforces on the code under test.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";
import {
  CATEGORY_NAMESPACE_MAP,
  ERROR_SENTINEL_BY_NAMESPACE,
  extractDeclaredNames,
  generateThemeCss,
  parseName,
} from "../../scripts/derive-tailwind-theme.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const TOKENS_CSS_PATH = join(ROOT, "src", "tokens.css");
const THEME_CSS_PATH = join(ROOT, "src", "theme.css");
const TAILWIND_BASE_CSS_PATH = join(ROOT, "node_modules", "tailwindcss", "index.css");

const tokensCss = readFileSync(TOKENS_CSS_PATH, "utf-8");
const themeCss = readFileSync(THEME_CSS_PATH, "utf-8");
// Tailwind's own `index.css` already inlines its default `@theme`, `@layer
// base` (preflight) and `@tailwind utilities` — using it directly as the
// compile input avoids `@import "tailwindcss"`, which requires a
// `loadStylesheet` callback compile() does not provide by default.
const tailwindBaseCss = readFileSync(TAILWIND_BASE_CSS_PATH, "utf-8");

/** Compile real Tailwind v4 against `css` and build the given candidate utility classes. */
async function compileTailwind(css: string, candidates: string[]): Promise<string> {
  const { build } = await compile(css, { base: ROOT });
  return build(candidates);
}

function hasUtilityClass(output: string, className: string): boolean {
  // Tailwind escapes special characters (e.g. `:`) in generated selectors;
  // none of the classes probed here contain any, so a literal selector
  // search is exact and unambiguous.
  return output.includes(`.${className} {`) || output.includes(`.${className}{`);
}

describe("mosaic-tokens / Tailwind v4 @theme — RED then GREEN, same fixture command", () => {
  it("RED: tokens.css alone (ordinary :root block) produces NO bg-danger-500 utility", async () => {
    const output = await compileTailwind(`${tailwindBaseCss}\n${tokensCss}`, ["bg-danger-500"]);
    expect(hasUtilityClass(output, "bg-danger-500")).toBe(false);
  });

  it("GREEN: tokens.css + theme.css produces bg-danger-500, resolving through var() to the real token", async () => {
    const output = await compileTailwind(`${tailwindBaseCss}\n${tokensCss}\n${themeCss}`, [
      "bg-danger-500",
    ]);
    expect(hasUtilityClass(output, "bg-danger-500")).toBe(true);
    expect(output).toContain("var(--color-danger-500)");
  });

  it("GREEN: a representative utility from each mapped category compiles (p-1, rounded-lg, shadow-1, ease-out, font-weight fw-bold, leading-normal, text-base, font-sans)", async () => {
    const candidates = [
      "bg-success-500",
      "p-1",
      "rounded-lg",
      "shadow-1",
      "ease-out",
      "font-bold",
      "leading-normal",
      "text-base",
      "font-sans",
    ];
    const output = await compileTailwind(
      `${tailwindBaseCss}\n${tokensCss}\n${themeCss}`,
      candidates,
    );
    for (const candidate of candidates) {
      expect(hasUtilityClass(output, candidate), `expected utility .${candidate} to compile`).toBe(
        true,
      );
    }
  });
});

describe("mosaic-tokens / @theme drift — bidirectional coverage", () => {
  const declaredNames = extractDeclaredNames(tokensCss);
  const mappedNames = declaredNames.filter((name) => {
    const { category } = parseName(name);
    return CATEGORY_NAMESPACE_MAP[category as keyof typeof CATEGORY_NAMESPACE_MAP] !== null;
  });

  it("every mapped --mosaic-* name has a corresponding @theme entry referencing it", () => {
    const missing = mappedNames.filter((name) => !themeCss.includes(`var(${name}`));
    expect(
      missing,
      `declared+mapped in tokens.css but missing from theme.css: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("every @theme entry's var() target is an actually-declared --mosaic-* name (no dangling reference)", () => {
    const declaredSet = new Set(declaredNames);
    const re = /var\((--mosaic-[\w-]+),/g;
    const referenced = [...themeCss.matchAll(re)].map((m) => m[1]);
    expect(referenced.length).toBeGreaterThan(0);
    const dangling = referenced.filter((name) => name !== undefined && !declaredSet.has(name));
    expect(dangling, `@theme references undeclared mosaic vars: ${dangling.join(", ")}`).toEqual(
      [],
    );
  });
});

describe("mosaic-tokens / @theme non-duplication — zero literal design values outside the sentinel", () => {
  const sentinelLiterals = new Set(Object.values(ERROR_SENTINEL_BY_NAMESPACE));

  /** Strip every var(...) call (both the reference and its sentinel fallback) before scanning for literals. */
  function stripVarCalls(css: string): string {
    return css.replace(/var\([^)]*\)/g, "");
  }

  it("positive control: the literal-value patterns DO match real design values in tokens.css (proves the sweep can match)", () => {
    expect(tokensCss).toMatch(/oklch\(/);
    expect(tokensCss).toMatch(/\b\d+px\b/);
  });

  it("zero hex/oklch/rgb/numeric design literals leak into theme.css outside of var() calls (sentinel excepted)", () => {
    const body = stripVarCalls(themeCss);
    const literalRe =
      /(#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|rgb\([^)]*\)|\b\d+(?:\.\d+)?(?:px|ms|rem|em)\b)/g;
    const found = [...body.matchAll(literalRe)].map((m) => m[0]);
    // The header comment and digest are prose, not CSS values, and are
    // excluded by stripVarCalls only removing var() calls — so also strip
    // the leading /* ... */ header block before asserting.
    const withoutHeader = body.replace(/\/\*[\s\S]*?\*\//, "");
    const foundInBody = [...withoutHeader.matchAll(literalRe)].map((m) => m[0]);
    expect(foundInBody, `literal values found outside var(): ${found.join(", ")}`).toEqual([]);
  });

  it("every sentinel literal is present only inside a var() fallback, never as a bare declaration value", () => {
    for (const sentinel of sentinelLiterals) {
      const escaped = sentinel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const bareRe = new RegExp(`:\\s*${escaped}\\s*;`);
      expect(
        bareRe.test(themeCss),
        `sentinel "${sentinel}" appears as a bare (non-var) value`,
      ).toBe(false);
    }
  });
});

describe("mosaic-tokens / @theme generator — fail-closed on empty parse", () => {
  it("an empty tokens.css source FAILS the generator rather than producing a vacuous empty theme", () => {
    expect(() => generateThemeCss("")).toThrow(/broken instrument/);
  });

  it("a tokens.css with unrelated CSS but zero --mosaic-* declarations also fails loudly", () => {
    expect(() => generateThemeCss(":root { --unrelated: 1px; }")).toThrow(/broken instrument/);
  });
});

describe("mosaic-tokens / @theme generator — unknown category fails loudly, naming it (Mutation C)", () => {
  it("a category absent from CATEGORY_NAMESPACE_MAP throws, naming the category", () => {
    const mutated = ":root {\n  --mosaic-neverseen-key: 1px;\n}\n";
    expect(mutated).toContain("--mosaic-neverseen-key");
    expect(() => generateThemeCss(mutated)).toThrow(/unknown mosaic category "neverseen"/);
  });

  it("declared-unmapped categories (duration) do NOT throw — they are a documented divergence, not an unknown", () => {
    const withDuration =
      ":root {\n  --mosaic-duration-probe: 999ms;\n  --mosaic-color-probe: oklch(0.5 0.5 50);\n}\n";
    const { skippedCategories, entries } = generateThemeCss(withDuration);
    expect(skippedCategories.has("duration")).toBe(true);
    expect(entries.some((e) => e.includes("--color-probe"))).toBe(true);
    expect(entries.some((e) => e.includes("duration"))).toBe(false);
  });
});

describe("mosaic-tokens / @theme generator — idempotent", () => {
  it("regenerating from the same tokens.css source twice produces byte-identical output", () => {
    const first = generateThemeCss(tokensCss);
    const second = generateThemeCss(tokensCss);
    expect(second.css).toBe(first.css);
  });
});

describe("mosaic-tokens / @theme negative pole — a removed token renders the sentinel, never transparency (Mutation B)", () => {
  let sentinelOutput: string;
  let realOutput: string;

  beforeAll(async () => {
    // Simulate "the referenced --mosaic-* var was removed from tokens.css"
    // by compiling theme.css WITHOUT tokens.css at all: every var() falls
    // through to its sentinel fallback, because the referenced custom
    // property is never declared anywhere in the compiled input.
    sentinelOutput = await compileTailwind(`${tailwindBaseCss}\n${themeCss}`, ["bg-danger-500"]);
    realOutput = await compileTailwind(`${tailwindBaseCss}\n${tokensCss}\n${themeCss}`, [
      "bg-danger-500",
    ]);
  });

  it("the utility class still compiles even when the underlying --mosaic-* var is entirely absent", () => {
    expect(hasUtilityClass(sentinelOutput, "bg-danger-500")).toBe(true);
  });

  it("without tokens.css, the compiled cascade carries the sentinel fallback on --color-danger-500, and .bg-danger-500 references that theme variable", () => {
    // Asserts on sentinelOutput (the real compile from beforeAll), not on
    // themeCss the source string — a source-string match would pass even if
    // Tailwind's compiler stripped, reordered, or failed to wire the
    // fallback into the cascade. This is what CSS custom property
    // substitution is defined to do with an undefined reference (CSS
    // Custom Properties spec, `var()` two-argument form): NOT observed here,
    // because no browser renders in this suite — this test stops at "the
    // fallback is present and wired in the compiled CSS", the one claim a
    // headless Tailwind compile can actually establish.
    expect(sentinelOutput).toContain(
      "--color-danger-500: var(--mosaic-color-danger-500, oklch(0.75 0.35 320));",
    );
    expect(sentinelOutput).toContain(".bg-danger-500 {");
    expect(sentinelOutput).toContain("background-color: var(--color-danger-500);");
  });

  it("with tokens.css present, the SAME generated rule instead resolves through the real declared value (sentinel is dormant, not chosen)", () => {
    expect(realOutput).toContain("var(--color-danger-500)");
    expect(tokensCss).toContain("--mosaic-color-danger-500: oklch(0.577 0.245 27)");
  });
});
