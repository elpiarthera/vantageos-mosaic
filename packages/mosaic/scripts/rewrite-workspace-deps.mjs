#!/usr/bin/env node
/**
 * Day 100 — Mosaic 0.3.1 hotfix Path B (Gamma recommendation).
 *
 * `npm publish` (unlike pnpm publish / yarn publish) does NOT auto-rewrite
 * `workspace:*` dependency specifiers. Publishing as-is leaks `workspace:*`
 * into the registry manifest and breaks every external `npm install`:
 *
 *   ETARGET No matching version found for @vantageos/mosaic-tokens@workspace:*
 *
 * This script runs from `prepublishOnly` and rewrites every `workspace:*`
 * (and `workspace:^` / `workspace:~`) reference in `package.json` to a
 * concrete `^<version>` matching the actual local sibling package's
 * `package.json` version.
 *
 * After publish completes, `postpublish` reverts `package.json` from git
 * so the source repo is never left in a mutated state.
 *
 * Fix-pattern: F-list k173e0bwvfpmngwrrtcqh3zzj988fnaq (workspace:* leak).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, ".."); // packages/mosaic/
const pkgPath = path.join(pkgRoot, "package.json");
const monorepoPackagesDir = path.resolve(pkgRoot, ".."); // packages/

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const sections = ["dependencies", "peerDependencies", "devDependencies", "optionalDependencies"];

const rewrites = [];

for (const section of sections) {
  const deps = pkg[section];
  if (!deps) continue;
  for (const name of Object.keys(deps)) {
    const spec = deps[name];
    if (typeof spec !== "string") continue;
    if (!spec.startsWith("workspace:")) continue;

    // Resolve sibling package name → directory
    // @vantageos/mosaic-tokens → packages/mosaic-tokens
    // Strip leading scope.
    const bareName = name.replace(/^@[^/]+\//, "");
    const siblingPkgPath = path.join(monorepoPackagesDir, bareName, "package.json");

    if (!fs.existsSync(siblingPkgPath)) {
      console.error(
        `[rewrite-workspace-deps] cannot resolve ${name}: sibling not found at ${siblingPkgPath}`,
      );
      process.exit(1);
    }
    const sibling = JSON.parse(fs.readFileSync(siblingPkgPath, "utf8"));
    if (!sibling.version) {
      console.error(`[rewrite-workspace-deps] sibling ${name} has no version field`);
      process.exit(1);
    }

    const newSpec = `^${sibling.version}`;
    deps[name] = newSpec;
    rewrites.push({ section, name, from: spec, to: newSpec });
  }
}

if (rewrites.length === 0) {
  console.log("[rewrite-workspace-deps] no workspace: refs found — nothing to rewrite");
  process.exit(0);
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);

console.log(`[rewrite-workspace-deps] rewrote ${rewrites.length} workspace: ref(s) for publish:`);
for (const r of rewrites) {
  console.log(`  - ${r.section}.${r.name}: ${r.from} → ${r.to}`);
}
console.log(
  "[rewrite-workspace-deps] package.json mutated for npm publish; postpublish must revert via git.",
);
