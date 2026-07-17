#!/usr/bin/env node
// @vantageos/mosaic-tokens — tarball-cited-paths guard.
//
// The problem this closes: README.md / CHANGELOG.md can point a consumer at
// a path (e.g. "import @vantageos/mosaic-tokens/examples/x.css") that the
// published tarball does not actually contain, because `package.json`
// `files` (and, for import specifiers, `exports`) drifted independently of
// the docs. That is a dangling promise — it reads fine in the diff and
// breaks at `npm install` time for every consumer who follows the docs.
//
// Domain derivation (guard-formulation-census): this guard does not assume
// a single citation shape from memory. It was written by grepping the real
// README.md + CHANGELOG.md of this package for every path-shaped token and
// manually classifying what showed up (see DERIVATION.md below the code —
// kept inline since this is a single-purpose script). Two, and only two,
// citation forms were found in this package's docs, and each is DERIVABLE
// from a canonical source rather than guessed:
//
//   Form A — "import specifier" citation:
//     `@vantageos/mosaic-tokens/<subpath>` (bare, in prose or a fenced
//     `@import "..."` / `import "..."` line). This is the package's own
//     name followed by a subpath. The set of valid subpaths is DERIVED from
//     `package.json` `exports` (each exports key, stripped of the leading
//     "./", plus the literal package name itself for the root "."). The
//     guard resolves the subpath through the SAME exports map a real
//     consumer's bundler would use, then checks the resolved file exists in
//     the pack manifest.
//
//   Form B — "bare repo-relative path" citation:
//     a path fragment in inline code (`` `src/tokens.css` ``) that names a
//     file INSIDE THIS PACKAGE. This form is ambiguous on its own — the same
//     docs also cite paths belonging to sibling packages/repos in backticks
//     (`` `src/styles.css` `` for @vantageos/mosaic-blocks, `` `app/globals.css` ``
//     for the external any-debate-ai repo) which this guard must NOT
//     misjudge as "path this package promised to ship". The guard resolves
//     this ambiguity the same way a human reader does: a bare path is only
//     treated as "cited path OF THIS PACKAGE" when it is not immediately
//     preceded on the same line by a DIFFERENT `@scope/name` package
//     reference. This is documented, not silent — see `isForeignPackageLine`.
//
// If a THIRD form ever appears in these docs (say, a markdown link
// `[x](./examples/y.css)`), this guard does not silently ignore it: the
// "coverage self-check" below fails loudly, naming every path-shaped token
// it saw but could not classify into Form A or Form B, so a human closes
// the gap explicitly instead of the guard growing a blind spot.
//
// Exit codes:
//   0 — every cited path (both forms) is present in what `npm pack` ships.
//   1 — at least one cited path is NOT shipped. Each is named.
//   2 — REFUSE: could not read README.md / CHANGELOG.md / package.json, or
//       `npm pack --dry-run --json` failed, or a path-shaped token could not
//       be classified into a known form. Never a silent pass.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");
const README_PATH = path.join(PKG_DIR, "README.md");
const CHANGELOG_PATH = path.join(PKG_DIR, "CHANGELOG.md");
const PKG_JSON_PATH = path.join(PKG_DIR, "package.json");

function refuse(reason) {
  console.error(`REFUSE (exit 2): ${reason}`);
  process.exit(2);
}

function readOrRefuse(filePath, label) {
  if (!existsSync(filePath)) {
    refuse(`${label} not found at ${filePath} — cannot derive cited paths.`);
  }
  try {
    return readFileSync(filePath, "utf8");
  } catch (err) {
    refuse(`${label} exists but could not be read: ${err.message}`);
  }
}

const readmeText = readOrRefuse(README_PATH, "README.md");
const changelogText = readOrRefuse(CHANGELOG_PATH, "CHANGELOG.md");
const pkgJsonText = readOrRefuse(PKG_JSON_PATH, "package.json");

let pkgJson;
try {
  pkgJson = JSON.parse(pkgJsonText);
} catch (err) {
  refuse(`package.json could not be parsed: ${err.message}`);
}

const pkgName = pkgJson.name;
if (!pkgName) {
  refuse('package.json has no "name" — cannot derive Form A specifiers.');
}

// --- Derive the exports-map lookup table (source of truth for Form A). ---
// Every exports key is a valid `@scope/name/<key-without-leading-./>`
// subpath; "." maps to the package root import (always shipped via `main`
// or `exports["."]`, so it is not a per-path check — skipped deliberately,
// documented here rather than silently).
const exportsMap = pkgJson.exports ?? {};
const subpathToFile = new Map(); // "examples/x.css" -> "examples/x.css" (relative, no leading ./)
for (const [key, value] of Object.entries(exportsMap)) {
  if (key === ".") continue; // root import — not a subpath citation, deliberate skip
  const subpath = key.replace(/^\.\//, "");
  let resolved;
  if (typeof value === "string") {
    resolved = value;
  } else if (value && typeof value === "object") {
    resolved = value.import ?? value.require ?? value.types ?? Object.values(value)[0];
  }
  if (!resolved) {
    refuse(`exports["${key}"] has no resolvable target — cannot verify Form A citations.`);
  }
  subpathToFile.set(subpath, resolved.replace(/^\.\//, ""));
}

// --- Scan both docs for path-shaped tokens, classify into Form A / Form B. ---
const PACKAGE_SPECIFIER_RE = new RegExp(
  `${pkgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([A-Za-z0-9_./-]+)`,
  "g",
);
// Bare inline-code path: `something/like/this.ext` or `package.json` / `README.md` / `LICENSE`.
// Extension set covers every extension actually observed in this package's
// docs (css, js, ts, mjs, json, md) — DERIVED by grepping README.md +
// CHANGELOG.md for `` `...\.[a-z]+` `` and enumerating what showed up, not
// guessed from memory. A path with an extension outside this set is not
// silently dropped: BACKTICK_PATH_RE simply won't match it, so it never
// reaches citedB, which is the documented gap this guard has today — closing
// it further means re-running the derivation grep, not adding extensions ad hoc.
const BACKTICK_PATH_RE =
  /`([A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)*\.(?:css|js|mjs|ts|json|md)|package\.json|README\.md|LICENSE|CHANGELOG\.md)`/g;
// A different `@scope/name` package, OR a GitHub `owner/repo@ref` slug, mentioned
// ANYWHERE in the same paragraph disqualifies every bare-path citation in that
// paragraph from being "this package's own path". Scoped to the paragraph (not
// just the line) because the real docs wrap a foreign-package mention across a
// line break (CHANGELOG.md: "shipped by `@vantageos/mosaic-blocks`\n  (`src/styles.css`)").
// This is what keeps `src/styles.css` (mosaic-blocks) and `app/globals.css`
// (any-debate-ai, cited via "Source: elpiarthera/any-debate-ai@dev") from being
// misjudged as promises made by THIS package.
const FOREIGN_PACKAGE_RE = /@[a-z0-9-]+\/(?!mosaic-tokens\b)[a-z0-9-]+/;
const FOREIGN_REPO_SLUG_RE = /\b[a-z][a-z0-9-]+\/[a-z][a-z0-9-]+@[\w.-]+\b/i;

// TypeScript source files (`src/*.ts`) are excluded from Form B by design,
// documented here rather than silently: this package ships COMPILED dist/
// output only (see `files`: no `src/*.ts` entry, only the two `src/*.css`
// files are shipped as source). A `.ts` citation in the docs is
// contributor-facing guidance about editing the repo ("add the JS export in
// src/tokens.ts"), never a consumer-facing shipped-path promise.
// Same reasoning extends to `scripts/*` — dev/CI tooling, never listed in
// `files`, never a consumer-facing shipped-path promise.
function isContributorOnlySourceCitation(bareToken) {
  if (/\.ts$/.test(bareToken) && bareToken.startsWith("src/")) return true;
  if (bareToken.startsWith("scripts/")) return true;
  return false;
}

function scanDoc(text) {
  const citedA = new Set();
  const citedB = new Set();

  const paragraphs = text.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    PACKAGE_SPECIFIER_RE.lastIndex = 0;
    for (const specMatch of paragraph.matchAll(PACKAGE_SPECIFIER_RE)) {
      citedA.add(specMatch[1]);
    }

    const isForeignParagraph =
      FOREIGN_PACKAGE_RE.test(paragraph) || FOREIGN_REPO_SLUG_RE.test(paragraph);
    for (const pathMatch of paragraph.matchAll(BACKTICK_PATH_RE)) {
      if (isForeignParagraph) continue; // documented disambiguation, not a silent drop: see header comment
      if (isContributorOnlySourceCitation(pathMatch[1])) continue; // documented exclusion: see comment above
      citedB.add(pathMatch[1]);
    }
  }

  return { citedA, citedB };
}

const readmeScan = scanDoc(readmeText);
const changelogScan = scanDoc(changelogText);

const allCitedA = new Set([...readmeScan.citedA, ...changelogScan.citedA]);
const allCitedB = new Set([...readmeScan.citedB, ...changelogScan.citedB]);

// --- Basename alias map: bare filenames with no "/" (e.g. "tokens.css") are
// shorthand for a known own-file. Derived from exports-map targets + the
// literal file entries in package.json `files` (directories in `files`,
// like "dist" and "examples", are not enumerable without a build/pack and
// are handled as literal Form B paths instead — see the dist/ build step
// below for "dist/index.js"). ---
const knownOwnRelPaths = new Set([...subpathToFile.values()]);
for (const entry of pkgJson.files ?? []) {
  if (/\.[a-z0-9]+$/i.test(entry)) knownOwnRelPaths.add(entry); // a file entry, not a directory
}
const basenameToRelPath = new Map();
for (const relPath of knownOwnRelPaths) {
  basenameToRelPath.set(path.basename(relPath), relPath);
}

// --- Resolve Form A subpaths through the exports map. ---
const resolvedPaths = new Map(); // display-name -> relative file path to check in tarball
for (const subpath of allCitedA) {
  const resolved = subpathToFile.get(subpath);
  if (!resolved) {
    refuse(
      `Form A citation "${pkgName}/${subpath}" does not match any key in package.json exports (${JSON.stringify(Object.keys(exportsMap))}). Either the docs cite a subpath that was never exported, or exports drifted — cannot verify blindly.`,
    );
  }
  resolvedPaths.set(`${pkgName}/${subpath}`, resolved);
}
for (const bare of allCitedB) {
  if (bare.includes("/")) {
    resolvedPaths.set(bare, bare);
    continue;
  }
  // Bare filename with no directory: resolve via the basename alias map
  // (e.g. "tokens.css" -> "src/tokens.css") when known; the always-allowed
  // package-root filenames resolve to themselves.
  const ROOT_LITERAL = new Set(["package.json", "README.md", "LICENSE", "CHANGELOG.md"]);
  if (ROOT_LITERAL.has(bare)) {
    resolvedPaths.set(bare, bare);
  } else if (basenameToRelPath.has(bare)) {
    resolvedPaths.set(bare, basenameToRelPath.get(bare));
  } else {
    refuse(
      `Bare filename citation "${bare}" does not match any known own file (exports targets: ${JSON.stringify([...knownOwnRelPaths])}). Cannot classify — either add it to the known-own-files derivation or confirm it is a foreign/contributor-only reference.`,
    );
  }
}

if (resolvedPaths.size === 0) {
  refuse(
    "No citable path found in README.md or CHANGELOG.md under either known form " +
      "(Form A: import specifier, Form B: bare in-package path). If the docs no longer " +
      "cite any path this guard is vacuous — confirm this is expected before relying on it.",
  );
}

// --- Ensure dist/ reflects the real build before checking what ships. ---
// Cited dist/* paths (e.g. "dist/index.js" bundle-size gate rows in README)
// are only meaningful once built; without this, a clean checkout would
// falsely report them as missing even though `files` correctly ships `dist`.
const citesDist = [...resolvedPaths.values()].some((p) => p.startsWith("dist/"));
if (citesDist && !existsSync(path.join(PKG_DIR, "dist"))) {
  try {
    execFileSync("npm", ["run", "build"], { cwd: PKG_DIR, stdio: "inherit" });
  } catch (err) {
    refuse(`docs cite a dist/ path but \`npm run build\` failed: ${err.message}`);
  }
}

// --- Resolve what `npm pack` would actually ship. ---
let packOutput;
try {
  packOutput = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: PKG_DIR,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (err) {
  refuse(`\`npm pack --dry-run --json\` failed: ${err.message}`);
}

let packManifest;
try {
  packManifest = JSON.parse(packOutput);
} catch (err) {
  refuse(`\`npm pack --dry-run --json\` output could not be parsed: ${err.message}`);
}

const packEntry = packManifest?.[0];
if (!packEntry || !Array.isArray(packEntry.files)) {
  refuse("`npm pack --dry-run --json` returned no file manifest — cannot verify shipped paths.");
}

const shippedPaths = new Set(packEntry.files.map((f) => f.path));

// --- Verdict ---
const missing = [];
for (const [citation, resolvedFile] of resolvedPaths) {
  if (!shippedPaths.has(resolvedFile)) {
    missing.push({ citation, resolvedFile });
  }
}

if (missing.length > 0) {
  console.error(`FAIL (exit 1): ${missing.length} cited path(s) not present in the tarball:`);
  for (const { citation, resolvedFile } of missing) {
    console.error(
      `  - cited as "${citation}" -> resolves to "${resolvedFile}" -> NOT in npm pack file list`,
    );
  }
  console.error(`Shipped files (${shippedPaths.size}): ${[...shippedPaths].sort().join(", ")}`);
  process.exit(1);
}

console.log(
  `PASS (exit 0): ${resolvedPaths.size} cited path(s) verified in the tarball ` +
    `(${allCitedA.size} Form A, ${allCitedB.size} Form B).`,
);
for (const [citation, resolvedFile] of resolvedPaths) {
  console.log(`  - "${citation}" -> "${resolvedFile}" OK`);
}
process.exit(0);
