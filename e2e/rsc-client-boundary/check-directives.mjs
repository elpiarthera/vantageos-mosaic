// Gate 6 — "use client" directive census over the INSTALLED package (the tarball, not the tree).
//
// Verdict (three states): exit 0 = PASS, exit 1 = VIOLATION (names each file), exit 2 = REFUSE
// (`REFUSING TO JUDGE: <what>`) when an input cannot be read or has a shape this census does not
// know. "Could not read" is never reported as a violation, and never as a pass.
//
// Domain: every JS file named by a condition (`import`, `require`) of an entry in the installed
// package.json `exports`. Non-JS targets (`.html`, `.yaml`) are not modules and are listed as
// skipped. Any other exports shape or condition refuses.
//
// The directive is read as a bundler reads it: a string-literal statement in the file's DIRECTIVE
// PROLOGUE (the leading run of string-literal statements, comments allowed between them), in
// double or single quotes, with or without the semicolon. A "use client" string after the prologue
// is not a directive.
//
// Expected state, derived per file:
//   client  = the export key is `./react` or `./react/<cat>`, OR the built file imports the react
//             family (react, react-dom, react/jsx-runtime...): those entries render React
//             components, so a Server Component must receive them as client references. The
//             directive must be the FIRST prologue statement.
//   server  = everything else (preact/*, view-config, server/*, tokens, host, streaming): the
//             directive must appear nowhere in the prologue, or a server import of the entry
//             becomes an uncallable client reference.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REACT_IMPORT =
  /\bfrom\s*["']react(-dom)?(\/[a-z-]+)?["']|\brequire\(["']react(-dom)?(\/[a-z-]+)?["']\)/;
const NON_MODULE = /\.(html|yaml)$/;
const CONDITIONS = new Set(["import", "require"]);

class Refusal extends Error {}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (e) {
    throw new Refusal(`${path} unreadable (${e.code ?? e.message})`);
  }
}

/** Skip whitespace and comments from `i`; returns the next code index (code.length at end). */
function skipTrivia(code, i) {
  let j = i;
  for (;;) {
    while (j < code.length && /\s/.test(code[j])) j += 1;
    if (code.startsWith("//", j)) {
      const nl = code.indexOf("\n", j);
      j = nl < 0 ? code.length : nl + 1;
    } else if (code.startsWith("/*", j)) {
      const close = code.indexOf("*/", j + 2);
      j = close < 0 ? code.length : close + 2;
    } else {
      return j;
    }
  }
}

/** The directive prologue: the string values of the leading string-literal statements. */
function prologueDirectives(code) {
  const directives = [];
  let i = skipTrivia(code, 0);
  while (code[i] === '"' || code[i] === "'") {
    const quote = code[i];
    const end = code.indexOf(quote, i + 1);
    if (end < 0) break;
    const value = code.slice(i + 1, end);
    if (value.includes("\n") || value.includes("\\")) break;
    // The literal is a statement only if it ends here: `;`, a line break, or the end of the file.
    let j = end + 1;
    while (j < code.length && (code[j] === " " || code[j] === "\t")) j += 1;
    if (code[j] === ";") j += 1;
    else if (j < code.length && code[j] !== "\n" && code[j] !== "\r") break;
    directives.push(value);
    i = skipTrivia(code, j);
  }
  return directives;
}

/** Returns { client, server, skipped, failures }; throws Refusal on anything it cannot read. */
function census(pkgRoot) {
  const pkgFile = join(pkgRoot, "package.json");
  let pkg;
  try {
    pkg = JSON.parse(read(pkgFile));
  } catch (e) {
    if (e instanceof Refusal) throw e;
    throw new Refusal(`${pkgFile} is not JSON (${e.message})`);
  }
  if (pkg.exports === null || typeof pkg.exports !== "object") {
    throw new Refusal(`${pkgFile} has no exports map`);
  }
  const result = { client: [], server: [], skipped: [], failures: [] };
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === "string") {
      if (!NON_MODULE.test(value)) {
        throw new Refusal(
          `exports ${key}: string target ${value} is not a shape this census reads`,
        );
      }
      result.skipped.push(`${key} -> ${value} (not a JS module)`);
      continue;
    }
    if (value === null || typeof value !== "object") {
      throw new Refusal(`exports ${key}: value is not an object`);
    }
    for (const [condition, target] of Object.entries(value)) {
      if (condition === "types") continue;
      if (!CONDITIONS.has(condition)) {
        throw new Refusal(`exports ${key}: unknown condition "${condition}"`);
      }
      const code = read(join(pkgRoot, target));
      const directives = prologueDirectives(code);
      const expectClient =
        key === "./react" || key.startsWith("./react/") || REACT_IMPORT.test(code);
      if (expectClient) {
        result.client.push(target);
        if (directives[0] !== "use client") {
          const first = directives.length > 0 ? JSON.stringify(directives[0]) : "none";
          result.failures.push(`${target}: client entry, first prologue directive is ${first}`);
        }
      } else {
        result.server.push(target);
        if (directives.includes("use client")) {
          result.failures.push(`${target}: server entry carries a "use client" directive`);
        }
      }
    }
  }
  if (result.client.length === 0 || result.server.length === 0) {
    throw new Refusal("the census found an empty side: it read nothing it can judge");
  }
  return result;
}

function main() {
  const pkgRoot = process.argv[2];
  if (!pkgRoot) {
    console.error("REFUSING TO JUDGE: no package root (usage: check-directives.mjs <dir>)");
    return 2;
  }
  let result;
  try {
    result = census(pkgRoot);
  } catch (e) {
    // A Refusal names what could not be read; any other error is also a failure to judge,
    // never a violation (exit 1) and never a pass.
    console.error(`REFUSING TO JUDGE: ${e instanceof Refusal ? e.message : e.stack}`);
    return 2;
  }
  console.log(`client files (directive required first): ${result.client.length}`);
  for (const f of result.client) console.log(`  client ${f}`);
  console.log(`server files (directive forbidden): ${result.server.length}`);
  for (const f of result.server) console.log(`  server ${f}`);
  for (const s of result.skipped) console.log(`  skipped ${s}`);
  if (result.failures.length > 0) {
    for (const f of result.failures) console.error(`FAIL: ${f}`);
    return 1;
  }
  console.log("PASS: Gate 6 directive census");
  return 0;
}

process.exitCode = main();
