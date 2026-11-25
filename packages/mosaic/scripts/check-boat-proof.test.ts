import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The publish gate must be FAIL-CLOSED: it accepts only a Boat log whose LAST `BOAT <sha> exit=<n>`
// line names HEAD with exit 0, preceded by pnpm's `publish:proof` banner for this package at this
// version, on a clean tree. Every other input is exit 1 (refusal) or exit 2 (the check could not
// run).
// Each case builds its own git repository; nothing is borrowed from the caller's checkout.
const SCRIPT = join(import.meta.dirname, "check-boat-proof.mjs");
const NAME = "@vantageos/mosaic";
const VERSION = "9.9.9";
const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

function git(cwd: string, args: string[]) {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_AUTHOR_NAME: "fixture",
      GIT_AUTHOR_EMAIL: "fixture@example.invalid",
      GIT_COMMITTER_NAME: "fixture",
      GIT_COMMITTER_EMAIL: "fixture@example.invalid",
    },
  });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout.trim();
}

/** A committed repo laid out as repo/packages/mosaic/{package.json,scripts/check.mjs}. */
function fakeRepo(pkg: Record<string, unknown> = { name: NAME, version: VERSION }) {
  const root = mkdtempSync(join(tmpdir(), "boat-proof-"));
  roots.push(root);
  const pkgDir = join(root, "packages", "mosaic");
  mkdirSync(join(pkgDir, "scripts"), { recursive: true });
  copyFileSync(SCRIPT, join(pkgDir, "scripts", "check.mjs"));
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify(pkg));
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "fixture"]);
  return { root, pkgDir, head: git(root, ["rev-parse", "HEAD"]) };
}

const BANNER = `> ${NAME}@${VERSION} publish:proof /sandbox/packages/mosaic`;
const boatLine = (sha: string, exit = 0) =>
  `BOAT ${sha} exit=${exit} wall=42s sandbox=s slug=x start=exec ttl=600s deps=fresh priv=none`;

/** A fresh directory outside every fixture repository. */
function logDir() {
  const d = mkdtempSync(join(tmpdir(), "boat-log-"));
  roots.push(d);
  return d;
}

function writeLog(dir: string, body: string) {
  const p = join(dir, "proof.log");
  writeFileSync(p, body);
  return p;
}

function run(
  pkgDir: string,
  proof: string | undefined,
  cwd = pkgDir,
  extra: NodeJS.ProcessEnv = {},
) {
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", ...extra };
  env.BOAT_PROOF = undefined; // spawnSync drops undefined entries
  if (proof !== undefined) env.BOAT_PROOF = proof;
  const r = spawnSync("node", [join(pkgDir, "scripts", "check.mjs")], {
    cwd,
    encoding: "utf8",
    env,
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe("check-boat-proof", () => {
  it("accepts a log for HEAD, exit 0, with the publish:proof banner, on a clean tree", () => {
    const { root, pkgDir, head } = fakeRepo();
    const proof = writeLog(
      logDir(),
      `${BANNER}\n> pnpm run build\n Tests  12 passed (12)\n${boatLine(head)}\n`,
    );
    const r = run(pkgDir, proof);
    expect(r.out).toContain(`Boat proof OK: ${head}`);
    expect(r.status).toBe(0);
    // The package root comes from the script's location, not from the working directory.
    expect(run(pkgDir, proof, root).status).toBe(0);
  });

  it("refuses when BOAT_PROOF is unset, printing the Boat command to run", () => {
    const { pkgDir, head } = fakeRepo();
    const r = run(pkgDir, undefined);
    expect(r.status).toBe(1);
    expect(r.out).toContain("BOAT_PROOF is not set");
    expect(r.out).toContain("boat-test-run ");
    expect(r.out).toContain(` ${head} -- bash -c 'pnpm install --frozen-lockfile && `);
    expect(r.out).toContain(`pnpm --filter ${NAME} run publish:proof'`);
  });

  it("refuses when BOAT_PROOF names a missing file", () => {
    const { pkgDir } = fakeRepo();
    const r = run(pkgDir, join(pkgDir, "no-such.log"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("BOAT_PROOF file unreadable");
    expect(r.out).toContain("ENOENT");
  });

  it("refuses a log with no BOAT summary line", () => {
    const { pkgDir } = fakeRepo();
    const proof = writeLog(logDir(), `${BANNER}\nCOULD-NOT-JUDGE: no summary\n`);
    const r = run(pkgDir, proof);
    expect(r.status).toBe(1);
    expect(r.out).toContain("no 'BOAT <40-hex sha> exit=<n>' line");
  });

  it("refuses a proof for another sha, naming both", () => {
    const { pkgDir, head } = fakeRepo();
    const other = "0".repeat(40);
    const proof = writeLog(pkgDir, `${BANNER}\n${boatLine(other)}\n`);
    git(pkgDir, ["add", "-A"]);
    git(pkgDir, ["commit", "-q", "-m", "log"]);
    const newHead = git(pkgDir, ["rev-parse", "HEAD"]);
    expect(newHead).not.toBe(head);
    const r = run(pkgDir, proof);
    expect(r.status).toBe(1);
    expect(r.out).toContain(`sha mismatch: Boat proof is for ${other}, HEAD is ${newHead}`);
  });

  it("refuses a run that exited non-zero", () => {
    const { pkgDir, head } = fakeRepo();
    const proof = writeLog(logDir(), `${BANNER}\n Tests  1 failed\n${boatLine(head, 1)}\n`);
    const r = run(pkgDir, proof);
    expect(r.status).toBe(1);
    expect(r.out).toContain("exited 1, not 0");
  });

  it("refuses a log without the publish:proof banner of this package and version", () => {
    const { pkgDir, head } = fakeRepo();
    const dir = logDir();
    const cases = [
      // the command that ran was not publish:proof
      `> ${NAME}@${VERSION} test /sandbox\n${boatLine(head)}\n`,
      // another version of the package
      `> ${NAME}@0.0.1 publish:proof /sandbox\n${boatLine(head)}\n`,
      // the banner as prose, not at line start
      `ran: > ${NAME}@${VERSION} publish:proof\n${boatLine(head)}\n`,
      // the banner AFTER the verdict line does not belong to that run
      `${boatLine(head)}\n${BANNER}\n`,
    ];
    for (const body of cases) {
      const proof = writeLog(dir, body);
      const r = run(pkgDir, proof);
      expect(r.status, body).toBe(1);
      expect(r.out).toContain(`does not show '> ${NAME}@${VERSION} publish:proof'`);
    }
  });

  it("refuses a dirty working tree (modified and untracked)", () => {
    const { pkgDir, head } = fakeRepo();
    const proof = writeLog(join(pkgDir, "..", ".."), `${BANNER}\n${boatLine(head)}\n`);
    // the log itself is untracked inside the repo: that alone makes the tree dirty
    let r = run(pkgDir, proof);
    expect(r.status).toBe(1);
    expect(r.out).toContain("working tree is not clean");
    rmSync(proof);
    const outside = writeLog(logDir(), `${BANNER}\n${boatLine(head)}\n`);
    expect(run(pkgDir, outside).status).toBe(0);
    const touched = { name: NAME, version: VERSION, x: 1 };
    writeFileSync(join(pkgDir, "package.json"), JSON.stringify(touched));
    r = run(pkgDir, outside);
    expect(r.status).toBe(1);
    expect(r.out).toContain(
      "working tree is not clean (first entry: ' M packages/mosaic/package.json')",
    );
  });

  it("takes the LAST BOAT line as the verdict", () => {
    const { pkgDir, head } = fakeRepo();
    const dir = logDir();
    const failLast = writeLog(dir, `${BANNER}\n${boatLine(head)}\n${boatLine(head, 3)}\n`);
    let r = run(pkgDir, failLast);
    expect(r.status).toBe(1);
    expect(r.out).toContain("exited 3, not 0");
    const passLast = writeLog(dir, `${boatLine("f".repeat(40))}\n${BANNER}\n${boatLine(head)}\n`);
    r = run(pkgDir, passLast);
    expect(r.status).toBe(0);
  });

  it("fails closed with exit 2 when the check itself cannot run", () => {
    // package.json without a version
    const noVersion = fakeRepo({ name: NAME });
    const proof = writeLog(logDir(), `${BANNER}\n${boatLine(noVersion.head)}\n`);
    let r = run(noVersion.pkgDir, proof);
    expect(r.status).toBe(2);
    expect(r.out).toContain("has no string name/version");
    // not a git repository: HEAD cannot be read
    const bare = mkdtempSync(join(tmpdir(), "boat-proof-nogit-"));
    roots.push(bare);
    mkdirSync(join(bare, "scripts"));
    copyFileSync(SCRIPT, join(bare, "scripts", "check.mjs"));
    writeFileSync(join(bare, "package.json"), JSON.stringify({ name: NAME, version: VERSION }));
    // the ceiling stops git from finding any repository above the fixture
    r = run(bare, proof, bare, { GIT_CEILING_DIRECTORIES: dirname(bare) });
    expect(r.status).toBe(2);
    expect(r.out).toContain("Boat proof check error");
  });
});
