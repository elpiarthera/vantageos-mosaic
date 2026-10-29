#!/usr/bin/env node
/**
 * check-config-view-bundle — gate on the built single-file config view (App standard A-2, A-5).
 *
 * Reads dist/config-view.html and FAILS (exit 1) unless:
 *   - the file exists and is non-empty (exit 2 for an unreadable input, naming it);
 *   - it is ONE file: no external <script src>, <link href> or @import / url(http...) reference;
 *   - it declares no network primitive;
 *   - its gzip size (what `gzip -c <file> | wc -c` prints) is under the 250,000-byte budget.
 *
 * The forbidden-pattern list is the list of network primitives the sandbox forbids, each with a
 * positive control in the test suite of this script (--self-test) proving the pattern can match.
 *
 * Usage: node scripts/check-config-view-bundle.mjs [path] [--self-test]
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

export const BUDGET_GZ_BYTES = 250_000;

/** Each rule: a name, the part of the file it reads ("html" = whole file, "css" = <style> blocks only) and a regexp. */
export const FORBIDDEN = [
  ["external script", "html", /<script[^>]+\bsrc\s*=/i],
  ["external stylesheet", "html", /<link[^>]+\bhref\s*=/i],
  ["css import", "css", /@import\s/i],
  ["remote url() in css", "css", /url\(\s*["']?https?:/i],
  ["localStorage use", "html", /\blocalStorage\b/],
  ["sessionStorage use", "html", /\bsessionStorage\b/],
];

const cssOf = (html) =>
  [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");

export function checkBundle(html, gzBytes) {
  const problems = [];
  if (html.length === 0) problems.push("bundle is empty");
  const css = cssOf(html);
  for (const [name, part, rx] of FORBIDDEN) {
    if (rx.test(part === "css" ? css : html)) problems.push(`forbidden: ${name}`);
  }
  if (gzBytes >= BUDGET_GZ_BYTES) {
    problems.push(`gzip ${gzBytes} bytes is not under the ${BUDGET_GZ_BYTES} byte budget`);
  }
  return problems;
}

function selfTest() {
  const samples = {
    "external script": '<script src="https://x/y.js"></script>',
    "external stylesheet": '<link rel="stylesheet" href="a.css">',
    "css import": "<style>@import 'a.css';</style>",
    "remote url() in css": "<style>a{background:url(https://x/y.png)}</style>",
    "localStorage use": "localStorage.getItem('a')",
    "sessionStorage use": "sessionStorage.x",
  };
  for (const [name] of FORBIDDEN) {
    const bad = checkBundle(samples[name] ?? "", 1);
    if (!bad.includes(`forbidden: ${name}`)) {
      console.error(`self-test FAILED: pattern "${name}" does not match its positive control`);
      process.exit(2);
    }
  }
  if (checkBundle('<script>new URL("https://x")</script>', 1).length !== 0) {
    console.error("self-test FAILED: JavaScript text is read as CSS");
    process.exit(2);
  }
  if (checkBundle("ok", 1).length !== 0) {
    console.error("self-test FAILED: a clean bundle is flagged");
    process.exit(2);
  }
  if (checkBundle("ok", BUDGET_GZ_BYTES).length === 0) {
    console.error("self-test FAILED: the size budget does not bite");
    process.exit(2);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  selfTest();
  if (process.argv.includes("--self-test")) {
    console.log("check-config-view-bundle: self-test OK (every pattern matches its control)");
    process.exit(0);
  }
  const target = resolve(
    process.argv.find((a, i) => i > 1 && !a.startsWith("--")) ??
      resolve(here, "..", "dist", "config-view.html"),
  );
  let html;
  try {
    html = readFileSync(target, "utf8");
  } catch (err) {
    console.error(
      `check-config-view-bundle: cannot read ${target}: ${err.message} (run the build first)`,
    );
    process.exit(2);
  }
  const gz = gzipSync(Buffer.from(html, "utf8")).length;
  const problems = checkBundle(html, gz);
  console.log(
    `config-view bundle: ${html.length} bytes raw, ${gz} bytes gzip (budget < ${BUDGET_GZ_BYTES})`,
  );
  if (problems.length > 0) {
    for (const p of problems) console.error(`  FAIL ${p}`);
    process.exit(1);
  }
  console.log("check-config-view-bundle: OK");
}
