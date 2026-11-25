// Gate 6 census — the census's own test, run with `node --test` by run-next-build.sh.
//
// Material: the REAL installed @vantageos/mosaic package (MOSAIC_PKG_DIR, set by the driver), copied
// to a scratch directory and mutated there. Each mutation asserts it landed (first line read back)
// before the census verdict is read. Verdict contract: 0 = PASS, 1 = VIOLATION, 2 = REFUSE.
//
// Directive forms covered (the domain the census must read, on BOTH sides — required on a client
// entry, forbidden on a server entry): double quotes and single quotes, with and without the
// semicolon, as the first prologue statement or after a comment or another directive.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const CENSUS = join(dirname(fileURLToPath(import.meta.url)), "check-directives.mjs");
const SOURCE = process.env.MOSAIC_PKG_DIR;
if (!SOURCE) {
  throw new Error("MOSAIC_PKG_DIR is not set: the census test needs the installed package");
}

const scratch = mkdtempSync(join(tmpdir(), "mosaic-census-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
let copies = 0;

/** A fresh copy of the installed package (package.json + dist), mutated by `mutate(dir)`. */
function pkgCopy(mutate) {
  copies += 1;
  const dir = join(scratch, `pkg-${copies}`);
  cpSync(join(SOURCE, "package.json"), join(dir, "package.json"));
  cpSync(join(SOURCE, "dist"), join(dir, "dist"), { recursive: true });
  mutate?.(dir);
  return dir;
}

function census(dir) {
  const r = spawnSync(process.execPath, [CENSUS, dir], { encoding: "utf8" });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

/** Rewrite a file's head, and assert the mutation landed before any verdict is read. */
function rewriteHead(dir, rel, transform, expectedFirstLine) {
  const file = join(dir, rel);
  writeFileSync(file, transform(readFileSync(file, "utf8")));
  assert.equal(readFileSync(file, "utf8").split("\n", 1)[0], expectedFirstLine, `${rel} not landed`);
}

const dropFirstLine = (code) => code.slice(code.indexOf("\n") + 1);

describe("Gate 6 census — PASS pole", () => {
  it("the clean installed package passes (exit 0)", () => {
    const r = census(pkgCopy());
    assert.equal(r.status, 0, r.out);
  });

  it("a client entry whose directive is single-quoted with no semicolon passes", () => {
    const dir = pkgCopy((d) =>
      rewriteHead(d, "dist/react/media.js", (c) => `'use client'\n${dropFirstLine(c)}`, "'use client'"),
    );
    const r = census(dir);
    assert.equal(r.status, 0, r.out);
  });

  it('a "use client" string inside a server entry body is not a directive (exit 0)', () => {
    const dir = pkgCopy((d) => {
      const file = join(d, "dist/view-config.js");
      writeFileSync(file, `${readFileSync(file, "utf8")}\nexport const note = "use client";\n`);
    });
    const r = census(dir);
    assert.equal(r.status, 0, r.out);
  });
});

describe("Gate 6 census — VIOLATION pole (exit 1, names the file)", () => {
  it("A: a client entry with its directive removed", () => {
    const dir = pkgCopy((d) =>
      rewriteHead(d, "dist/react/forms.cjs", dropFirstLine, "'use strict';"),
    );
    const r = census(dir);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /dist\/react\/forms\.cjs/);
  });

  const serverForms = [
    ["B: double quotes, no semicolon", "dist/server/config-view.js", '"use client"'],
    ["double quotes, semicolon", "dist/preact/forms.js", '"use client";'],
    ["single quotes, semicolon", "dist/view-config.cjs", "'use client';"],
    ["single quotes, no semicolon", "dist/server/resource.js", "'use client'"],
  ];
  for (const [label, rel, line] of serverForms) {
    it(`a server entry carrying the directive — ${label}`, () => {
      const dir = pkgCopy((d) => rewriteHead(d, rel, (c) => `${line}\n${c}`, line));
      const r = census(dir);
      assert.equal(r.status, 1, r.out);
      assert.match(r.out, new RegExp(rel.replaceAll("/", "\\/").replaceAll(".", "\\.")));
    });
  }

  it("a server entry carrying the directive after a comment and 'use strict'", () => {
    const dir = pkgCopy((d) =>
      rewriteHead(
        d,
        "dist/tokens.cjs",
        (c) => `// banner\n'use strict';\n"use client"\n${dropFirstLine(c)}`,
        "// banner",
      ),
    );
    const r = census(dir);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /dist\/tokens\.cjs/);
  });
});

describe("Gate 6 census — REFUSE pole (exit 2, REFUSING TO JUDGE)", () => {
  it("a missing package root", () => {
    const r = census(join(scratch, "does-not-exist"));
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /REFUSING TO JUDGE: .*does-not-exist.*package\.json/);
  });

  it("an exports target that cannot be read", () => {
    const dir = pkgCopy((d) => rmSync(join(d, "dist/react/display.js")));
    const r = census(dir);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /REFUSING TO JUDGE: .*dist\/react\/display\.js/);
  });

  it("a package.json that is not JSON", () => {
    const dir = pkgCopy((d) => writeFileSync(join(d, "package.json"), "{ not json"));
    const r = census(dir);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /REFUSING TO JUDGE: .*package\.json/);
  });

  it("an exports condition the census does not know", () => {
    const dir = pkgCopy((d) => {
      const file = join(d, "package.json");
      const pkg = JSON.parse(readFileSync(file, "utf8"));
      pkg.exports["./react/progress"].browser = "./dist/react/progress.js";
      writeFileSync(file, JSON.stringify(pkg));
    });
    const r = census(dir);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /REFUSING TO JUDGE: .*browser/);
  });

  it("no package root argument", () => {
    const r = spawnSync(process.execPath, [CENSUS], { encoding: "utf8" });
    assert.equal(r.status, 2, `${r.stdout}${r.stderr}`);
  });
});
