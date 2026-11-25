// Gate 6 — "use client" directive census over the INSTALLED package (the tarball, not the tree).
//
// Domain: every JS file named by a condition (`import`, `require`) of an entry in the installed
// package.json `exports`. Non-JS targets (`.html`, `.yaml`) are not modules and are listed as
// skipped, never silently dropped. Any other shape of exports value fails loud.
//
// Expected state, derived per file:
//   client  = the export key is `./react` or `./react/<cat>`, OR the built file imports the react
//             family (react, react-dom, react/jsx-runtime...): those entries render React
//             components, so a Server Component must receive them as client references.
//   server  = everything else (preact/*, view-config, server/*, tokens, host, streaming): it must
//             NOT carry the directive, or a server import of it becomes an uncallable reference.
// A client file carries `"use client";` as its FIRST line; a server file carries it nowhere.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkgRoot = process.argv[2];
if (!pkgRoot) {
  console.error("usage: node check-directives.mjs <installed @vantageos/mosaic dir>");
  process.exit(2);
}
const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));
const DIRECTIVE = '"use client";';
const REACT_IMPORT =
  /\bfrom\s*["']react(-dom)?(\/[a-z-]+)?["']|\brequire\(["']react(-dom)?(\/[a-z-]+)?["']\)/;
const NON_MODULE = /\.(html|yaml)$/;

const failures = [];
const client = [];
const server = [];
const skipped = [];

for (const [key, value] of Object.entries(pkg.exports)) {
  if (typeof value === "string") {
    if (NON_MODULE.test(value)) {
      skipped.push(`${key} -> ${value} (not a JS module)`);
      continue;
    }
    failures.push(`${key}: string export ${value} is not a shape this check reads`);
    continue;
  }
  if (value === null || typeof value !== "object") {
    failures.push(`${key}: unreadable exports value`);
    continue;
  }
  for (const [condition, target] of Object.entries(value)) {
    if (condition === "types") continue;
    if (condition !== "import" && condition !== "require") {
      failures.push(`${key}: unknown condition "${condition}"`);
      continue;
    }
    const code = readFileSync(join(pkgRoot, target), "utf8");
    const firstLine = code.split("\n", 1)[0];
    const expectClient = key === "./react" || key.startsWith("./react/") || REACT_IMPORT.test(code);
    if (expectClient) {
      client.push(target);
      if (firstLine !== DIRECTIVE) {
        failures.push(`${target}: client entry, first line is ${JSON.stringify(firstLine)}`);
      }
    } else {
      server.push(target);
      if (code.includes(DIRECTIVE) || code.includes("'use client'")) {
        failures.push(`${target}: server entry carries a "use client" directive`);
      }
    }
  }
}

console.log(`client files (directive required on line 1): ${client.length}`);
for (const f of client) console.log(`  client ${f}`);
console.log(`server files (directive forbidden): ${server.length}`);
for (const f of server) console.log(`  server ${f}`);
for (const s of skipped) console.log(`  skipped ${s}`);
if (client.length === 0 || server.length === 0) {
  failures.push("census found an empty side: the check read nothing it can judge");
}
if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exit(1);
}
console.log("PASS: Gate 6 directive census");
