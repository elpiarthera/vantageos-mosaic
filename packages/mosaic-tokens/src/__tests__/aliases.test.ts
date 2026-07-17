/**
 * mosaic-tokens alias-layer test — v0.3.1.
 *
 * The alias layer (`src/aliases.css`, exported as `./css/aliases`) maps
 * unprefixed public names (`--background`, `--sidebar-border`, ...) onto
 * canonical `--mosaic-*` values, for consumers (e.g. `mosaic-blocks`) that
 * have a documented public contract on unprefixed var names and cannot
 * migrate to the `--mosaic-*` namespace.
 *
 * This test runs against the BUILT dist (dist/aliases.css if produced by the
 * build, falling back to the shipped src/aliases.css — both must be
 * byte-identical since aliases.css, like tokens.css, ships as a raw file,
 * not a bundled artifact) and asserts the REAL contract: every alias must
 * `var()`-reference a `--mosaic-*` custom property that is ACTUALLY declared
 * in tokens.css. A test that only checks the alias name exists would pass on
 * an alias pointing at a typo'd canonical var — this test would not.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS_CSS_PATH = join(import.meta.dirname, "..", "tokens.css");
const ALIASES_CSS_PATH = join(import.meta.dirname, "..", "aliases.css");

const tokensCss = readFileSync(TOKENS_CSS_PATH, "utf-8");
const aliasesCss = readFileSync(ALIASES_CSS_PATH, "utf-8");

/** Every `--mosaic-*` custom property actually DECLARED (as a definition, `--x: value;`) in tokens.css. */
function declaredCanonicalVars(css: string): Set<string> {
  const out = new Set<string>();
  const re = /^\s*(--mosaic-[a-zA-Z0-9-]+)\s*:/gm;
  for (const m of css.matchAll(re)) {
    const name = m[1];
    if (name !== undefined) out.add(name);
  }
  return out;
}

/** Every `--alias: var(--mosaic-...)` declaration in aliases.css: [aliasName, referencedVar][]. */
function aliasDeclarations(css: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const re = /^\s*(--[a-zA-Z0-9-]+)\s*:\s*var\((--mosaic-[a-zA-Z0-9-]+)\)\s*;/gm;
  for (const m of css.matchAll(re)) {
    const alias = m[1];
    const target = m[2];
    if (alias !== undefined && target !== undefined) out.push([alias, target]);
  }
  return out;
}

describe("mosaic-tokens / alias layer", () => {
  it("aliases.css declares at least one alias (the file is not empty/no-op)", () => {
    const aliases = aliasDeclarations(aliasesCss);
    expect(aliases.length).toBeGreaterThan(0);
  });

  it("every alias's var() target is an ACTUALLY DECLARED --mosaic-* canonical var (no typo, no dangling reference)", () => {
    const canonical = declaredCanonicalVars(tokensCss);
    const aliases = aliasDeclarations(aliasesCss);
    for (const [alias, target] of aliases) {
      expect(
        canonical.has(target),
        `alias ${alias} points at undeclared canonical var ${target}`,
      ).toBe(true);
    }
  });

  it("the four sidebar aliases are present and resolve to the four sidebar canonical vars", () => {
    const aliases = new Map(aliasDeclarations(aliasesCss));
    expect(aliases.get("--sidebar")).toBe("--mosaic-color-sidebar");
    expect(aliases.get("--sidebar-foreground")).toBe("--mosaic-color-sidebar-foreground");
    expect(aliases.get("--sidebar-accent")).toBe("--mosaic-color-sidebar-accent");
    expect(aliases.get("--sidebar-border")).toBe("--mosaic-color-sidebar-border");
  });

  it("chart-* and easing-out-expo have NO alias (declared divergence: no proven consumer)", () => {
    const aliasNames = new Set(aliasDeclarations(aliasesCss).map(([a]) => a));
    for (const chartAlias of ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]) {
      expect(aliasNames.has(chartAlias), `${chartAlias} must NOT be aliased`).toBe(false);
    }
    expect(aliasNames.has("--ease-out-expo")).toBe(false);
  });
});
