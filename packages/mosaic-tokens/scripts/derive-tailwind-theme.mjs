#!/usr/bin/env node
/**
 * Derives src/theme.css (a Tailwind v4 `@theme` block) from src/tokens.css.
 *
 * Tailwind v4 does NOT derive utility classes from custom properties declared
 * in an ordinary `:root` block — it only reads an `@theme` block. Without
 * this file, every consumer had to hand-write a bridge
 * (`--color-mosaic-x: var(--mosaic-color-x);`) themselves, which is exactly
 * the derive-never-type failure class reopened through a side door: the
 * third such bridge retypes a value instead of referencing it.
 *
 * This script is the single generator of that bridge. Every emitted `@theme`
 * entry is a `var()` REFERENCE to a `--mosaic-*` custom property declared in
 * tokens.css — never a duplicated literal value.
 *
 * CATEGORY -> TAILWIND v4 THEME NAMESPACE MAPPING (empirically verified
 * against tailwindcss@4.1.8 + @tailwindcss/postcss@4.1.8 by compiling probe
 * fixtures with each namespace; see packages/mosaic-tokens/README.md
 * "Tailwind v4 theme surface" section for the verbatim probe commands):
 *
 *   color   -> --color-<key>          (bg-*, text-*, border-*, ring-*, ...)
 *   space   -> --spacing-<key>        (p-*, m-*, gap-*, ...)
 *   text    -> --text-<key>           (text-* font-size utility)
 *   lh      -> --leading-<key>        (leading-* utility)
 *   fw      -> --font-weight-<key>    (font-* weight utility)
 *   font    -> --font-<key>           (font-* family utility)
 *   shadow  -> --shadow-<key>         (shadow-* utility)
 *   radius  -> --radius-<key>         (rounded-* utility)
 *   easing  -> --ease-<key>           (ease-* utility)
 *   duration -> NONE. Tailwind v4 has no themable namespace for transition
 *     duration (confirmed empirically: a `--duration-probe` theme entry
 *     produces zero generated utility; also absent from tailwindcss'
 *     documented theme variable namespace list). This is a DECLARED
 *     DIVERGENCE, not a silent skip: names in this category are omitted from
 *     the generated file, and `main()` prints a loud, named warning on every
 *     run so the omission stays visible.
 *
 * Any category NOT in CATEGORY_NAMESPACE_MAP at all (never seen before) is a
 * different case — a genuinely unknown category — and is fatal: the script
 * throws, naming the category, rather than silently emitting nothing for it.
 *
 * NEGATIVE POLE — the loud fallback. If a `--mosaic-*` property tokens.css
 * declares today is later removed while the generated file still references
 * it, a bare `var(--mosaic-color-x)` resolves to the guaranteed-invalid
 * value and the property is dropped — for `background-color` that renders
 * fully TRANSPARENT, i.e. the exact silent-disappearance trap this file
 * exists to prevent. Every reference below therefore carries a fallback via
 * `var()`'s second argument: an unmistakable, impossible-as-a-design-choice
 * sentinel, keyed by namespace (ERROR_SENTINEL_BY_NAMESPACE). The sentinel is
 * never a plausible value for its own scale (999px spacing, an out-of-gamut
 * magenta OKLCH, an instant-snap easing) — a plausible fallback would be a
 * duplicated design value AND a silent failure at once.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS_PATH = join(ROOT, "src", "tokens.css");
const OUT_PATH = join(ROOT, "src", "theme.css");
const NAME_RE = /(--mosaic-[\w-]+):/g;
const CATEGORY_RE = /^--mosaic-([a-z]+)-(.+)$/;

/** category -> Tailwind v4 theme namespace prefix, or null for a declared, documented non-mapping. */
export const CATEGORY_NAMESPACE_MAP = Object.freeze({
  color: "--color-",
  space: "--spacing-",
  text: "--text-",
  lh: "--leading-",
  fw: "--font-weight-",
  font: "--font-",
  shadow: "--shadow-",
  radius: "--radius-",
  easing: "--ease-",
  duration: null,
});

/** namespace prefix -> loud, obviously-wrong fallback value for that scale. */
export const ERROR_SENTINEL_BY_NAMESPACE = Object.freeze({
  "--color-": "oklch(0.75 0.35 320)",
  "--spacing-": "999px",
  "--text-": "999px",
  "--leading-": "999",
  "--font-weight-": "133",
  "--font-": '"MOSAIC-TOKEN-MISSING", sans-serif',
  "--shadow-": "0 0 0 999px oklch(0.75 0.35 320)",
  "--radius-": "999px",
  "--ease-": "steps(1)",
});

export function extractDeclaredNames(cssSource) {
  const names = new Set();
  for (const m of cssSource.matchAll(NAME_RE)) {
    if (m[1] !== undefined) names.add(m[1]);
  }
  return [...names].sort();
}

export function parseName(name) {
  const match = name.match(CATEGORY_RE);
  if (match === null) {
    throw new Error(`declared property does not match --mosaic-<category>-<key>: ${name}`);
  }
  const category = match[1];
  const key = match[2];
  if (category === undefined || key === undefined) {
    throw new Error(`could not parse category/key out of: ${name}`);
  }
  return { category, key };
}

/**
 * Pure core: tokens.css source text in, generated theme.css text + metadata
 * out. No filesystem access — this is what both `main()` (CLI, real
 * tokens.css) and the test suite (real tokens.css AND mutated fixtures,
 * e.g. an injected unknown category) call, so the mutation tests exercise
 * the exact same code path the published package ships.
 */
export function generateThemeCss(cssSource) {
  const names = extractDeclaredNames(cssSource);
  if (names.length === 0) {
    throw new Error(
      "extraction found zero --mosaic-* properties in tokens.css — broken instrument, refusing to write an empty theme",
    );
  }

  const entries = [];
  const skippedCategories = new Set();

  for (const name of names) {
    const { category, key } = parseName(name);

    if (!(category in CATEGORY_NAMESPACE_MAP)) {
      throw new Error(
        `unknown mosaic category "${category}" (from ${name}) has no entry in CATEGORY_NAMESPACE_MAP — add a Tailwind v4 namespace mapping (or an explicit null with a documented reason) before regenerating`,
      );
    }

    const namespace = CATEGORY_NAMESPACE_MAP[category];
    if (namespace === null) {
      skippedCategories.add(category);
      continue;
    }

    const sentinel = ERROR_SENTINEL_BY_NAMESPACE[namespace];
    if (sentinel === undefined) {
      throw new Error(
        `namespace "${namespace}" has no ERROR_SENTINEL_BY_NAMESPACE entry — add one`,
      );
    }

    entries.push(`  ${namespace}${key}: var(${name}, ${sentinel});`);
  }

  const digest = createHash("sha256").update(entries.join("\n")).digest("hex").slice(0, 16);

  const header = `/*
 * GENERATED FILE — do not edit by hand.
 * Produced by scripts/derive-tailwind-theme.mjs from src/tokens.css.
 * Run \`npm run tailwind-theme:build\` (or the pnpm/yarn equivalent) to regenerate.
 *
 * Every entry below is a var() REFERENCE to a --mosaic-* custom property
 * declared in tokens.css — never a duplicated literal value. The second
 * var() argument is a loud, out-of-scale fallback: if the referenced
 * --mosaic-* property is ever removed while this file still points at it,
 * the fallback renders instead of silently resolving to nothing.
 *
 * The "duration" mosaic category is intentionally NOT represented here —
 * Tailwind v4 has no themable namespace for transition duration. See the
 * generator script docstring for the full mapping and this declared
 * divergence.
 *
 * digest: ${digest}
 */
@theme {
${entries.join("\n")}
}
`;

  return { css: header, entries, skippedCategories };
}

function main() {
  const cssSource = readFileSync(CSS_PATH, "utf-8");
  const { css, entries, skippedCategories } = generateThemeCss(cssSource);

  for (const category of [...skippedCategories].sort()) {
    console.warn(
      `[derive-tailwind-theme] category "${category}" has NO Tailwind v4 theme namespace (declared divergence, see script docstring) — its tokens are NOT in src/theme.css`,
    );
  }

  writeFileSync(OUT_PATH, css, "utf-8");
  console.log(
    `src/theme.css regenerated: ${entries.length} @theme entries across ${
      Object.keys(CATEGORY_NAMESPACE_MAP).length - skippedCategories.size
    } mapped categories (${skippedCategories.size} declared-unmapped: ${[...skippedCategories].join(", ") || "none"}).`,
  );
}

// Only run the CLI side effect (write src/theme.css) when this file is
// executed directly — importing it for tests must never touch the filesystem.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
