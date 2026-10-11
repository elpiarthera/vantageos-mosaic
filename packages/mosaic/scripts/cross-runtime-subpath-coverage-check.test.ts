import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// Gate 4 must be FAIL-CLOSED: every input it cannot read is a non-zero exit (2) that names the
// input, distinct from exit 1 (a real coverage failure); and its default package root comes from
// the script's own location, never from the working directory.
const SCRIPT = join(import.meta.dirname, "cross-runtime-subpath-coverage-check.py");
const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const EXPORT = (rt: string, cat: string) => ({
  types: `./dist/${rt}/${cat}.d.ts`,
  import: `./dist/${rt}/${cat}.js`,
});
const BODY = "export { a, b };\n//# sourceMappingURL=x.map ........................\n";

/** A self-contained fake package: scripts/<copy of the script>, package.json, dist/, registry.yaml. */
function fakePackage(
  opts: { registry?: string | null; breakPreact?: boolean; noCategories?: boolean } = {},
) {
  const root = mkdtempSync(join(tmpdir(), "gate4-"));
  roots.push(root);
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "src"));
  copyFileSync(SCRIPT, join(root, "scripts", "check.py"));
  const exports: Record<string, unknown> = { ".": { import: "./dist/index.js" } };
  if (!opts.noCategories) {
    exports["./forms"] = { import: "./dist/forms.js" };
    for (const rt of ["react", "preact"]) exports[`./${rt}/forms`] = EXPORT(rt, "forms");
  }
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "fake", exports }));
  for (const rt of ["react", "preact"]) {
    mkdirSync(join(root, "dist", rt), { recursive: true });
    if (rt === "preact" && opts.breakPreact) continue;
    writeFileSync(join(root, "dist", rt, "forms.js"), BODY);
    writeFileSync(join(root, "dist", rt, "forms.d.ts"), BODY);
  }
  if (opts.registry !== null) {
    writeFileSync(
      join(root, "registry.yaml"),
      opts.registry ?? 'version: "1"\ncomponents:\n  - name: Input\n    category: forms\n',
    );
  }
  return root;
}

function run(args: string[], cwd: string, script = SCRIPT, env: NodeJS.ProcessEnv = {}) {
  const r = spawnSync("python3", [script, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe("Gate 4 script is fail-closed on unreadable input (exit 2, names the input)", () => {
  it("a non-existent --package-root exits 2 and names the path", () => {
    const r = run(["--package-root", "/nonexistent/pkg-root"], tmpdir());
    expect(r.status).toBe(2);
    expect(r.out).toContain("/nonexistent/pkg-root");
  });

  it("a directory without package.json exits 2 and names package.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "gate4-empty-"));
    roots.push(dir);
    const r = run(["--package-root", dir], tmpdir());
    expect(r.status).toBe(2);
    expect(r.out).toContain("package.json");
  });

  it("an unparseable package.json exits 2 and names it (no traceback exit 1)", () => {
    const root = fakePackage();
    writeFileSync(join(root, "package.json"), "{ not json");
    const r = run(["--package-root", root], tmpdir());
    expect(r.status).toBe(2);
    expect(r.out).toContain("package.json");
  });

  it("a package with no bare category exports exits 2 instead of passing vacuously", () => {
    const root = fakePackage({ noCategories: true });
    const r = run(["--package-root", root], tmpdir());
    expect(r.status).toBe(2);
    expect(r.out.toLowerCase()).toContain("no bare");
  });

  it("a missing registry exits 2 unless the skip is explicit", () => {
    const root = fakePackage({ registry: null });
    expect(run(["--package-root", root], tmpdir()).status).toBe(2);
    expect(run(["--package-root", root, "--skip-registry-check"], tmpdir()).status).toBe(0);
  });

  it("an explicit --registry that does not exist exits 2 and names it", () => {
    const root = fakePackage();
    const r = run(["--package-root", root, "--registry", "/nope/registry.yaml"], tmpdir());
    expect(r.status).toBe(2);
    expect(r.out).toContain("/nope/registry.yaml");
  });

  it("the registry cross-check runs without PyYAML (built-in reader), and still fails on a gap", () => {
    const root = fakePackage({
      registry:
        'version: "1"\ncomponents:\n  - name: X\n    category: forms\n  - name: Y\n    category: ghosts\n',
    });
    const r = run(["--package-root", root], tmpdir());
    expect(r.status).toBe(1);
    expect(r.out).toContain("ghosts");
  });
});

describe("Gate 4 script without PyYAML (CI has none installed)", () => {
  it("still runs the registry cross-check through the built-in reader, and still fails on a gap", () => {
    const blocker = mkdtempSync(join(tmpdir(), "noyaml-"));
    roots.push(blocker);
    writeFileSync(join(blocker, "yaml.py"), 'raise ImportError("yaml blocked for this test")\n');
    const env = { PYTHONPATH: blocker };
    const ok = run(["--package-root", fakePackage()], tmpdir(), SCRIPT, env);
    expect(ok.status).toBe(0);
    const gap = fakePackage({
      registry: 'version: "1"\ncomponents:\n  - name: Y\n    category: ghosts\n',
    });
    const r = run(["--package-root", gap], tmpdir(), SCRIPT, env);
    expect(r.status).toBe(1);
    expect(r.out).toContain("ghosts");
    expect(r.out).not.toMatch(/skipping registry/i);
  });
});

describe("Gate 4 script: default package root follows the script, not the cwd", () => {
  it("run from a sub-directory with no arguments, it finds its own package and passes", () => {
    const root = fakePackage();
    const r = run([], join(root, "src"), join(root, "scripts", "check.py"));
    expect(r.status).toBe(0);
    expect(r.out).toContain("PASS");
    expect(r.out).toContain(root);
  });

  it("run from an unrelated directory it still checks its own package", () => {
    const root = fakePackage({ breakPreact: true });
    const r = run([], tmpdir(), join(root, "scripts", "check.py"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("preact/forms");
  });
});

describe("Gate 4 script: exit codes stay distinct and the pass case holds (positive control)", () => {
  it("a complete package passes with exit 0", () => {
    expect(run(["--package-root", fakePackage()], tmpdir()).status).toBe(0);
  });
  it("a real coverage gap is exit 1, not 2", () => {
    expect(run(["--package-root", fakePackage({ breakPreact: true })], tmpdir()).status).toBe(1);
  });
});

// Eta (#76): a registry that yields ZERO categories was a silent PASS. Every probe below carries
// an unexported category ("zzzcat") the gate must catch: exit 2 when the registry cannot be read
// as a registry, exit 1 when it is readable and the category is a real gap. Each runs with
// PyYAML and with PyYAML blocked, and the status is the script's own (spawnSync, no pipe).
function blockedYamlEnv() {
  const blocker = mkdtempSync(join(tmpdir(), "noyaml-"));
  roots.push(blocker);
  writeFileSync(join(blocker, "yaml.py"), 'raise ImportError("yaml blocked for this test")\n');
  return { PYTHONPATH: blocker };
}

describe.each([
  ["with PyYAML", {} as NodeJS.ProcessEnv],
  ["without PyYAML", blockedYamlEnv()],
])("Gate 4 registry reading is fail-closed (%s)", (_label, env) => {
  const go = (registry: string) =>
    run(["--package-root", fakePackage({ registry })], tmpdir(), SCRIPT, env);

  it("probe a: an emptied registry file exits 2 and names the registry", () => {
    const r = go("");
    expect(r.status).toBe(2);
    expect(r.out).toContain("registry.yaml");
  });

  it("probe b: `components:` renamed to `items:` (unknown shape) exits 2", () => {
    const r = go('version: "1"\nitems:\n  - name: X\n    category: zzzcat\n');
    expect(r.status).toBe(2);
    expect(r.out).toContain("components");
  });

  it("probe c: a trailing # comment on the category line is read, so the gap is caught (exit 1)", () => {
    const r = go('version: "1"\ncomponents:\n  - name: X\n    category: zzzcat  # moved\n');
    expect(r.status).toBe(1);
    expect(r.out).toContain("zzzcat");
  });

  it("a `components:` list that parses to zero categories exits 2", () => {
    expect(go('version: "1"\ncomponents: []\n').status).toBe(2);
    expect(go('version: "1"\ncomponents:\n  - name: X\n').status).toBe(2);
  });

  it("flow-style components (a form the reader does not know) exit 2, never a pass", () => {
    expect(go('version: "1"\ncomponents: [{name: X, category: zzzcat}]\n').status).toBe(2);
  });

  it("positive control: comments and quotes in a readable registry pass", () => {
    const r = go(
      '# header\nversion: "1"\ncomponents:\n  # forms\n  - name: Input\n    category: "forms"  # ok\n  - name: Select\n    category: forms\n',
    );
    expect(r.status).toBe(0);
  });

  it("the real registry.yaml of this package is readable: a gap (1), never unreadable (2) or a pass (0)", () => {
    const real = join(import.meta.dirname, "..", "registry.yaml");
    const root = fakePackage();
    const r = run(["--package-root", root, "--registry", real], tmpdir(), SCRIPT, env);
    // the fake package only exports `forms`; the real registry declares more
    expect(r.status).toBe(1);
  });
});

describe("the two readers must agree", () => {
  it("with PyYAML present, a registry the built-in reader reads differently exits 2", () => {
    const registry =
      'version: "1"\ncomponents:\n  - name: X\n    category: forms\n  - name: Y\n    category: >-\n      ghosts\n';
    const r = run(["--package-root", fakePackage({ registry })], tmpdir());
    expect(r.status).toBe(2);
    expect(r.out.toLowerCase()).toContain("disagree");
  });
});
