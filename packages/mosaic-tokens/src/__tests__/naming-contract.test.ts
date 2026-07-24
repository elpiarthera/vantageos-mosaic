/**
 * mosaic-tokens naming-contract drift test.
 *
 * The `--mosaic-<category>-<key>` convention was, before this test, stated
 * only as prose in a tokens.css comment: unpinnable, undetectable drift for
 * any downstream DTCG->CSS exporter. This test enforces that the generated,
 * versioned `naming-contract.json` artifact stays in lockstep with the
 * actual set of `--mosaic-*` custom properties declared in tokens.css.
 *
 * Domain census (guard-formulation-census): the full set of declared
 * `--mosaic-*` custom property names is derived directly from tokens.css by
 * regex extraction — never hand-transcribed from the prose comment, which
 * can itself go stale. The contract's category list is likewise derived
 * from the declared names, not copied from that same comment.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const CSS_PATH = join(ROOT, "src", "tokens.css");
const CONTRACT_PATH = join(ROOT, "naming-contract.json");

const NAME_PATTERN = /^--mosaic-([a-z]+)-(.+)$/;

function extractDeclaredNames(cssSource: string): string[] {
  const re = /(--mosaic-[\w-]+):/g;
  const names = new Set<string>();
  for (const m of cssSource.matchAll(re)) {
    const name = m[1];
    if (name !== undefined) names.add(name);
  }
  return [...names].sort();
}

// Independent re-derivation, deliberately NOT imported from the generator —
// coupling this test to the generator's own helpers would let a bug in both
// places cancel out silently.
function deriveCategoriesIndependently(names: string[]): string[] {
  const categories = new Set<string>();
  for (const name of names) {
    const match = name.match(NAME_PATTERN);
    const category = match?.[1];
    if (category !== undefined) categories.add(category);
  }
  return [...categories].sort();
}

function computeSurfaceDigestIndependently(categories: string[], names: string[]): string {
  const canonical = JSON.stringify({
    categories: [...categories].sort(),
    names: [...names].sort(),
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

interface NamingContract {
  contractVersion: string;
  surfaceDigest: string;
  pattern: string;
  categories: string[];
  names: string[];
}

describe("mosaic-tokens / naming-contract drift", () => {
  const cssSource = readFileSync(CSS_PATH, "utf-8");
  const declaredNames = extractDeclaredNames(cssSource);
  const contract: NamingContract = JSON.parse(readFileSync(CONTRACT_PATH, "utf-8"));

  it("the extraction found a non-zero number of --mosaic-* properties (broken-instrument fail-closed)", () => {
    expect(declaredNames.length).toBeGreaterThan(0);
  });

  it("naming-contract.json names == exactly the set derived from tokens.css (no missing, no extra)", () => {
    const contractSet = new Set(contract.names);
    const declaredSet = new Set(declaredNames);

    const missingFromContract = declaredNames.filter((n) => !contractSet.has(n));
    expect(
      missingFromContract,
      `declared in CSS but missing from contract: ${missingFromContract.join(", ")}`,
    ).toEqual([]);

    const extraInContract = contract.names.filter((n) => !declaredSet.has(n));
    expect(
      extraInContract,
      `present in contract but not declared in CSS: ${extraInContract.join(", ")}`,
    ).toEqual([]);
  });

  it("every declared name matches --mosaic-<category>-<key> and its category is a known contract category", () => {
    const knownCategories = new Set(contract.categories);
    for (const name of declaredNames) {
      const match = name.match(NAME_PATTERN);
      expect(
        match,
        `name does not match pattern --mosaic-<category>-<key>: ${name}`,
      ).not.toBeNull();
      const category = match?.[1];
      expect(
        category !== undefined && knownCategories.has(category),
        `unknown category "${category}" for declared property: ${name}`,
      ).toBe(true);
    }
  });

  it("contract carries a semver contractVersion and the documented pattern string", () => {
    expect(contract.contractVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(contract.pattern).toBe("--mosaic-<category>-<key>");
  });

  it("surfaceDigest matches an independently recomputed digest over categories+names (enforced, unlike contractVersion)", () => {
    const categories = deriveCategoriesIndependently(declaredNames);
    const expectedDigest = computeSurfaceDigestIndependently(categories, declaredNames);
    expect(
      contract.surfaceDigest,
      `stale surfaceDigest: contract has "${contract.surfaceDigest}", recomputed from tokens.css is "${expectedDigest}" — regenerate naming-contract.json`,
    ).toBe(expectedDigest);
  });
});
