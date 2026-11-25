#!/usr/bin/env node
/**
 * Publish gate: refuse `npm publish` / `pnpm publish` unless a Boat proof for the exact HEAD
 * is supplied.
 *
 * Tests never run on the publishing host. They run on Boat, against a committed sha, through
 * the package script `publish:proof` (build + test + size-limit). This script reads the saved
 * Boat log named by the env var BOAT_PROOF and accepts it only when ALL of these hold:
 *
 *   1. BOAT_PROOF is set and names a readable file;
 *   2. the log carries a Boat summary line `BOAT <40-hex sha> exit=<int> ...` (the LAST one
 *      is the verdict: it is the line boat-test-run prints after the command's own output);
 *   3. that sha is `git rev-parse HEAD`;
 *   4. that exit is 0;
 *   5. before that line, pnpm's own script banner `> <name>@<version> publish:proof` shows the
 *      proof script of THIS package at THIS version ran (a line pnpm writes, never prose);
 *   6. the working tree is clean: a proof for HEAD says nothing about uncommitted changes.
 *
 * Exit 0: proof accepted. Exit 1: refused, one line naming what is missing, then the Boat
 * command that produces the proof. Exit 2: the check itself could not run (fail closed).
 *
 * The package root is derived from this file's location, never from the working directory.
 *
 * Limit: the log is not authenticated. A hand-assembled log (a banner copied from a real run plus a
 * BOAT line from a trivial run) passes, because boat-test-run does not print the command it ran;
 * this check stops an accidental publish, not a deliberate one.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

class Refusal extends Error {}

function git(args) {
  return execFileSync("git", args, {
    cwd: pkgRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function proofCommand(pkgName) {
  let repo = "<repo-checkout>";
  let sha = "<HEAD sha>";
  try {
    repo = git(["rev-parse", "--show-toplevel"]).trim();
    sha = git(["rev-parse", "HEAD"]).trim();
  } catch {
    // The hint keeps its placeholders; the refusal itself already says what failed.
  }
  const steps = [
    "pnpm install --frozen-lockfile",
    "pnpm --filter @vantageos/mosaic-tokens build",
    `pnpm --filter ${pkgName} run publish:proof`,
  ];
  return `boat-test-run ${repo} ${sha} -- bash -c '${steps.join(" && ")}' > <log> 2>&1`;
}

function readPackage() {
  const pkg = JSON.parse(readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
  if (typeof pkg.name !== "string" || typeof pkg.version !== "string") {
    throw new Error(`package.json at ${pkgRoot} has no string name/version`);
  }
  return pkg;
}

function check(pkg) {
  const proofPath = process.env.BOAT_PROOF;
  if (!proofPath) throw new Refusal("BOAT_PROOF is not set (path to a saved Boat log)");

  let log;
  try {
    log = readFileSync(path.resolve(proofPath), "utf8");
  } catch (e) {
    throw new Refusal(`BOAT_PROOF file unreadable: ${proofPath} (${e.code ?? e.message})`);
  }

  const lines = log.split(/\r?\n/);
  const boatRe = /^BOAT ([0-9a-f]{40}) exit=(-?\d+)(?:\s|$)/;
  let verdictIdx = -1;
  let match = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    match = boatRe.exec(lines[i]);
    if (match) {
      verdictIdx = i;
      break;
    }
  }
  if (!match) {
    throw new Refusal(`no 'BOAT <40-hex sha> exit=<n>' line in ${proofPath}`);
  }
  const [, proofSha, exitCode] = match;

  const head = git(["rev-parse", "HEAD"]).trim();
  if (!/^[0-9a-f]{40}$/.test(head)) throw new Error(`git rev-parse HEAD returned '${head}'`);
  if (proofSha !== head) {
    throw new Refusal(`sha mismatch: Boat proof is for ${proofSha}, HEAD is ${head}`);
  }
  if (exitCode !== "0") {
    throw new Refusal(`Boat run for ${proofSha} exited ${exitCode}, not 0`);
  }

  const markerRe = new RegExp(
    `^> ${escapeRegExp(pkg.name)}@${escapeRegExp(pkg.version)} publish:proof(?:\\s|$)`,
  );
  if (!lines.slice(0, verdictIdx).some((l) => markerRe.test(l))) {
    throw new Refusal(
      `the log does not show '> ${pkg.name}@${pkg.version} publish:proof' before the BOAT line`,
    );
  }

  const dirty = git(["status", "--porcelain"]);
  if (dirty.trim() !== "") {
    const first = dirty.split("\n")[0];
    throw new Refusal(`working tree is not clean (first entry: '${first}'); commit or stash`);
  }
  return head;
}

let pkg;
try {
  pkg = readPackage();
  const sha = check(pkg);
  console.log(`Boat proof OK: ${sha}`);
  process.exit(0);
} catch (e) {
  if (e instanceof Refusal) {
    console.error(`Boat proof refused: ${e.message}`);
    console.error(`Produce it with: ${proofCommand(pkg.name)}`);
    console.error("Then publish with BOAT_PROOF=<log> set.");
    process.exit(1);
  }
  console.error(`Boat proof check error: ${e.message}`);
  process.exit(2);
}
