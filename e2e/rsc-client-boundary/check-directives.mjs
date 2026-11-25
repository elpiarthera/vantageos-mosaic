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

// Trivia, from the ECMAScript grammar (ECMA-262, "Lexical Grammar"): WhiteSpace (TAB, VT, FF,
// ZWNBSP/BOM, any Zs code point including SP and NBSP), LineTerminator (LF, CR, LS, PS) and Comment
// (SingleLineComment `// ...` up to a line terminator, MultiLineComment `/* ... */`; a
// MultiLineComment holding a line terminator counts as a line terminator for ASI).
const WHITE_SPACE = /[\t\v\f\ufeff\p{Zs}]/u;
const LINE_TERMINATOR = /[\n\r\u2028\u2029]/;
// After a line break, a token starting with one of these continues the expression (no ASI), so the
// string literal before it is not a statement of its own. Declared set: punctuators that can
// follow an expression, plus the template backtick.
const CONTINUES_EXPRESSION = /^(?:[([.+\-*/%,?=<>&|^`]|in\b|instanceof\b)/;

/**
 * Skip trivia from `i`. Returns { at, newline }: the next code index (code.length at the end) and
 * whether a line terminator was crossed. An unterminated MultiLineComment refuses.
 */
function skipTrivia(code, i, file) {
  let j = i;
  let newline = false;
  for (;;) {
    const ch = code[j];
    if (j >= code.length) return { at: j, newline };
    if (WHITE_SPACE.test(ch)) {
      j += 1;
    } else if (LINE_TERMINATOR.test(ch)) {
      newline = true;
      j += 1;
    } else if (code.startsWith("//", j)) {
      while (j < code.length && !LINE_TERMINATOR.test(code[j])) j += 1;
    } else if (code.startsWith("/*", j)) {
      const close = code.indexOf("*/", j + 2);
      if (close < 0) throw new Refusal(`${file}: unterminated comment in the directive prologue`);
      if (LINE_TERMINATOR.test(code.slice(j + 2, close))) newline = true;
      j = close + 2;
    } else {
      return { at: j, newline };
    }
  }
}

/**
 * The directive prologue: the values of the leading string-literal statements. A literal is a
 * statement when, after trivia, it is followed by `;`, the end of the file, `}`, or a line break
 * whose next token does not continue the expression. A prologue string holding an escape sequence
 * is not decoded here: the census refuses rather than guess its value.
 */
function prologueDirectives(code, file) {
  const directives = [];
  let i = skipTrivia(code, 0, file).at;
  while (code[i] === '"' || code[i] === "'") {
    const quote = code[i];
    let end = i + 1;
    while (end < code.length && code[end] !== quote && !LINE_TERMINATOR.test(code[end])) {
      if (code[end] === "\\") {
        throw new Refusal(`${file}: prologue string with an escape sequence, value not decoded`);
      }
      end += 1;
    }
    if (code[end] !== quote) break;
    const value = code.slice(i + 1, end);
    const after = skipTrivia(code, end + 1, file);
    let next = after.at;
    if (code[next] === ";") {
      next = skipTrivia(code, next + 1, file).at;
    } else if (next >= code.length || code[next] === "}") {
      // end of the file or of the block: the statement ends here
    } else if (!after.newline || CONTINUES_EXPRESSION.test(code.slice(next, next + 10))) {
      break;
    }
    directives.push(value);
    i = next;
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
      const directives = prologueDirectives(code, target);
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
