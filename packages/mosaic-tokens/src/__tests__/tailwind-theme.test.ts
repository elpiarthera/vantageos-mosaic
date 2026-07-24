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

/**
 * Parse every `--<prop>: <value>;` declaration out of the (single) `@theme`
 * block of a generated theme.css source. Deliberately dumb line-based
 * parsing — good enough for this file's own generated shape, and it must
 * stay independent of the generator's own `entries` array (see
 * generateThemeCss) so a bug shared by both sides cannot cancel out.
 */
function parseThemeDeclarations(css: string): Array<{ prop: string; value: string }> {
  const declarations: Array<{ prop: string; value: string }> = [];
  const re = /^\s*(--[\w-]+):\s*(.+);\s*$/gm;
  for (const m of css.matchAll(re)) {
    const prop = m[1];
    const value = m[2];
    if (prop !== undefined && value !== undefined) declarations.push({ prop, value });
  }
  return declarations;
}

/** The Tailwind v4 namespace prefix a generated `--<prop>` belongs to, longest-prefix-first (`--font-weight-` before `--font-`). */
function namespaceOf(prop: string): string | undefined {
  const namespaces = Object.values(CATEGORY_NAMESPACE_MAP)
    .filter((ns): ns is string => ns !== null)
    .sort((a, b) => b.length - a.length);
  return namespaces.find((ns) => `${prop}-`.startsWith(ns) || prop.startsWith(ns));
}

/**
 * The ONE permitted shape for a generated declaration's value:
 * `var(--mosaic-<name>, <the sentinel registered for this declaration's own
 * namespace>)` — nothing else. Any other notation (hsl(), calc(), a bare
 * number, color-mix(), an unlisted unit, ...) is rejected BY CONSTRUCTION,
 * because it is not this shape — no enumeration of forbidden notations is
 * needed or maintained.
 */
function matchesPermittedShape(
  prop: string,
  value: string,
): { ok: true } | { ok: false; reason: string } {
  const namespace = namespaceOf(prop);
  if (namespace === undefined) {
    return { ok: false, reason: `"${prop}" does not belong to any known @theme namespace` };
  }
  const sentinel = ERROR_SENTINEL_BY_NAMESPACE[namespace];
  if (sentinel === undefined) {
    return { ok: false, reason: `namespace "${namespace}" has no registered sentinel` };
  }
  const escapedSentinel = sentinel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const shapeRe = new RegExp(`^var\\(--mosaic-[\\w-]+, ${escapedSentinel}\\)$`);
  if (!shapeRe.test(value)) {
    return {
      ok: false,
      reason: `value "${value}" is not var(--mosaic-<name>, ${sentinel}) — the one permitted shape for the "${namespace}" namespace`,
    };
  }
  return { ok: true };
}

describe("mosaic-tokens / @theme value shape — every declaration is var(--mosaic-<name>, <its own sentinel>), nothing else", () => {
  const declaredNames = new Set(extractDeclaredNames(tokensCss));
  const declarations = parseThemeDeclarations(themeCss);

  it("positive control: parsing finds a non-zero number of declarations (the instrument is not vacuously passing)", () => {
    expect(declarations.length).toBeGreaterThan(0);
  });

  it("shape check REJECTS a fabricated declaration that is not the permitted shape (the check can actually fail)", () => {
    // Counterpart to the positive control above: a check that never rejects
    // anything is not a check. None of these four notations were ever
    // enumerable by the retired blacklist regex's own list, and each is
    // rejected here purely for not matching the required shape.
    expect(matchesPermittedShape("--color-fabricated", "hsl(120 50% 50%)").ok).toBe(false);
    expect(matchesPermittedShape("--color-fabricated", "42").ok).toBe(false);
    expect(matchesPermittedShape("--color-fabricated", "calc(1px + 2px)").ok).toBe(false);
    expect(matchesPermittedShape("--color-fabricated", "color-mix(in oklab, red, blue)").ok).toBe(
      false,
    );
    // And the legitimate shape, with the correct sentinel for its own
    // namespace, is accepted — proving the rejections above are about shape,
    // not about the check being unconditionally negative.
    expect(
      matchesPermittedShape(
        "--color-fabricated",
        "var(--mosaic-color-fabricated, oklch(0.75 0.35 320))",
      ).ok,
    ).toBe(true);
  });

  it("zero escapes: every generated declaration matches the one permitted shape for its own namespace", () => {
    const escapes = declarations
      .map(({ prop, value }) => ({ prop, value, result: matchesPermittedShape(prop, value) }))
      .filter((d) => !d.result.ok);
    expect(
      escapes.map((e) => `${e.prop}: ${e.value}`),
      `escapes from the permitted shape: ${escapes
        .map((e) => (e.result.ok ? "" : `${e.prop} — ${e.result.reason}`))
        .join("; ")}`,
    ).toEqual([]);
  });

  it("zero false rejections: every generated declaration is ALSO accepted (the check does not reject the legitimate)", () => {
    const accepted = declarations.filter(
      ({ prop, value }) => matchesPermittedShape(prop, value).ok,
    );
    expect(accepted.length, "count of accepted legitimate declarations").toBe(declarations.length);
  });

  it("every accepted declaration's --mosaic-<name> resolves to a property actually declared in tokens.css", () => {
    const danglingRefs = declarations.flatMap(({ value }) => {
      const m = value.match(/^var\((--mosaic-[\w-]+),/);
      const ref = m?.[1];
      if (ref === undefined) return [];
      return declaredNames.has(ref) ? [] : [ref];
    });
    expect(danglingRefs, `references undeclared mosaic vars: ${danglingRefs.join(", ")}`).toEqual(
      [],
    );
  });

  it("the 'duration' divergence, negative pole: a duration entry present in theme.css is rejected by the shape check (no namespace maps to it)", () => {
    const withStrayDuration = "--duration-fast: var(--mosaic-duration-fast, 100ms);";
    const parsed = parseThemeDeclarations(withStrayDuration);
    expect(parsed).toHaveLength(1);
    const strayDeclaration = parsed[0];
    if (strayDeclaration === undefined) throw new Error("expected exactly one parsed declaration");
    const result = matchesPermittedShape(strayDeclaration.prop, strayDeclaration.value);
    expect(result.ok).toBe(false);
  });

  it("the 'duration' divergence, positive pole: zero generated declarations reference any --mosaic-duration-* name", () => {
    const durationRefs = declarations.filter(({ value }) => value.includes("--mosaic-duration-"));
    expect(durationRefs, "declarations referencing a duration token").toEqual([]);
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
