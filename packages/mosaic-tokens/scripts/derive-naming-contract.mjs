#!/usr/bin/env node
/**
 * Derives naming-contract.json from src/tokens.css.
 *
 * The naming convention `--mosaic-<category>-<key>` was previously stated
 * only as prose in a tokens.css comment. This script extracts the actual
 * set of declared `--mosaic-*` custom properties and their categories,
 * so the contract can never drift silently from the source of truth.
 *
 * contractVersion is hand-set intent, independent of the package version.
 * It is NOT enforced to move with the naming surface — nothing in this
 * script checks that a surface change bumped it. Bump it by hand when you
 * intentionally add/remove/rename a category or a name; re-running this
 * script otherwise reuses the existing contractVersion from the checked-in
 * artifact (idempotent regeneration).
 *
 * surfaceDigest IS enforced: a sha256 (truncated to 16 hex chars) over the
 * sorted categories and sorted names only — never over contractVersion or
 * pattern, so it changes for exactly one reason, a surface change. It
 * cannot be stale because nobody types it; the drift test recomputes it
 * independently and fails loudly the moment it diverges from the artifact.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS_PATH = join(ROOT, "src", "tokens.css");
const CONTRACT_PATH = join(ROOT, "naming-contract.json");
const PATTERN = "--mosaic-<category>-<key>";
const NAME_RE = /(--mosaic-[\w-]+):/g;
const CATEGORY_RE = /^--mosaic-([a-z]+)-(.+)$/;
const DEFAULT_CONTRACT_VERSION = "1.0.0";

function extractDeclaredNames(cssSource) {
  const names = new Set();
  for (const m of cssSource.matchAll(NAME_RE)) {
    if (m[1] !== undefined) names.add(m[1]);
  }
  return [...names].sort();
}

function deriveCategories(names) {
  const categories = new Set();
  for (const name of names) {
    const match = name.match(CATEGORY_RE);
    if (match === null) {
      throw new Error(`declared property does not match ${PATTERN}: ${name}`);
    }
    const category = match[1];
    if (category !== undefined) categories.add(category);
  }
  return [...categories].sort();
}

function computeSurfaceDigest(categories, names) {
  const canonical = JSON.stringify({
    categories: [...categories].sort(),
    names: [...names].sort(),
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

function readExistingContractVersion() {
  try {
    const existing = JSON.parse(readFileSync(CONTRACT_PATH, "utf-8"));
    if (typeof existing.contractVersion === "string") {
      return existing.contractVersion;
    }
  } catch {
    // No existing artifact (first generation) — fall through to default.
  }
  return DEFAULT_CONTRACT_VERSION;
}

function main() {
  const cssSource = readFileSync(CSS_PATH, "utf-8");
  const names = extractDeclaredNames(cssSource);
  if (names.length === 0) {
    throw new Error(
      "extraction found zero --mosaic-* properties in tokens.css — broken instrument, refusing to write an empty contract",
    );
  }
  const categories = deriveCategories(names);
  const contractVersion = readExistingContractVersion();
  const surfaceDigest = computeSurfaceDigest(categories, names);

  const contract = {
    contractVersion,
    surfaceDigest,
    pattern: PATTERN,
    categories,
    names,
  };

  writeFileSync(CONTRACT_PATH, `${JSON.stringify(contract, null, 2)}\n`, "utf-8");
  console.log(
    `naming-contract.json regenerated: ${names.length} names across ${categories.length} categories.`,
  );
}

main();
