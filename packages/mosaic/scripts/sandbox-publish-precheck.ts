#!/usr/bin/env tsx
/**
 * sandbox-publish-precheck.ts
 *
 * RULE #19 Gate 1 — clean-room sandbox build verification for @vantageos/mosaic.
 *
 * Spawns a Vercel Sandbox (Firecracker MicroVM, node22+), clones the repo at a
 * specific SHA, runs the full build + test + npm publish --dry-run pipeline, and
 * returns a structured JSON result. Pilote bu-mcp, reproductible Sigma + Theta.
 *
 * Usage:
 *   tsx scripts/sandbox-publish-precheck.ts --sha=<SHA> [--package=@vantageos/mosaic] [--runtime=node22]
 *
 * Exit codes:
 *   0  pass:true  — build + test + dry-run publish succeeded
 *   1  pass:false — build/test/publish failed (expected on broken SHA)
 *   2  spawn failure (auth or sandbox API error)
 *   3  clone failure (SHA not found, network error)
 *   4  global timeout exceeded
 *
 * Auth (in priority order):
 *   1. VERCEL_OIDC_TOKEN env var  — OIDC bearer token (recommended)
 *   2. VERCEL_ACCESS_TOKEN env var — PAT fallback
 *
 * Output: JSON to stdout, logs to stderr.
 */

import { createHash } from "node:crypto";
import { Sandbox } from "@vercel/sandbox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreCheckResult {
  pass: boolean;
  sandboxId: string;
  sha: string;
  ratio: string;
  tarballListing: string[];
  tarballSha256: string;
  builtAt: string;
  durationMs: number;
  estimatedCostCents: number;
  error?: string;
  errorCode?: string;
  details?: string;
}

interface SpawnError {
  status: "aborted";
  reason: string;
  recovery_suggestion: string;
  exitCode: number;
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  sha: string;
  pkg: string;
  runtime: string;
  timeoutMs: number;
} {
  const args = argv.slice(2);
  let sha = "";
  let pkg = "@vantageos/mosaic";
  let runtime = "node22";
  const timeoutMs = 15 * 60 * 1000; // allow-time-estimate: Gate 1 hard SLA — 15 min max per RULE #19 spec

  for (const arg of args) {
    if (arg.startsWith("--sha=")) sha = arg.slice(6);
    else if (arg.startsWith("--package=")) pkg = arg.slice(10);
    else if (arg.startsWith("--runtime=")) runtime = arg.slice(10);
  }

  if (!sha) {
    printError({
      status: "aborted",
      reason: "Missing required parameter: --sha=<SHA>. Cannot proceed.",
      recovery_suggestion: "Pass --sha=<commit-sha> as a CLI argument.",
      exitCode: 2,
    });
    process.exit(2);
  }

  return { sha, pkg, runtime, timeoutMs };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function resolveCredentials(): { token: string; source: "oidc" | "pat" } {
  const oidc = process.env.VERCEL_OIDC_TOKEN;
  const pat = process.env.VERCEL_ACCESS_TOKEN;

  if (oidc) return { token: oidc, source: "oidc" };
  if (pat) return { token: pat, source: "pat" };

  // No credentials — produce script + note design-ready state per BLOCKER PROTOCOL
  printError({
    status: "aborted",
    reason:
      "Credential VERCEL_OIDC_TOKEN not configured. Set env var VERCEL_OIDC_TOKEN (preferred) or VERCEL_ACCESS_TOKEN (PAT fallback).",
    recovery_suggestion:
      "Set VERCEL_OIDC_TOKEN via OIDC provider or VERCEL_ACCESS_TOKEN via https://vercel.com/account/tokens. Script is design-ready, waiting for token provisioning.",
    exitCode: 2,
  });
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  process.stderr.write(`[sandbox-precheck] ${msg}\n`);
}

function printError(err: SpawnError): void {
  process.stderr.write(`${JSON.stringify(err, null, 2)}\n`);
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Parse ratio from vitest output: "X passed" / "Y tests" or similar formats.
 * Returns "tests X/Y PASS" or "tests 0/0 PASS" if not determinable.
 */
function parseTestRatio(stdout: string, stderr: string): string {
  const combined = stdout + stderr;

  // Vitest: "3 passed" or "3 passed (5)" or "✓ 3 tests passed"
  const passedMatch = combined.match(/(\d+)\s+passed/i);
  // Vitest: "5 tests" or "5 tests total"
  const totalMatch = combined.match(/(\d+)\s+tests?(?:\s+total)?/i);

  if (passedMatch && totalMatch) {
    const passed = passedMatch[1];
    const total = totalMatch[1];
    return `tests ${passed}/${total} PASS`;
  }
  if (passedMatch) {
    const passed = passedMatch[1];
    return `tests ${passed}/${passed} PASS`;
  }

  // Fallback: look for "X/Y" pattern
  const ratioMatch = combined.match(/(\d+)\/(\d+)/);
  if (ratioMatch) return `tests ${ratioMatch[1]}/${ratioMatch[2]} PASS`;

  return "tests 0/0 PASS";
}

/**
 * Parse npm publish --dry-run --json output to extract file listing.
 * npm v7+ --json includes a `files` array or `bundled` array, or we fall back
 * to parsing the text output for "npm notice" lines listing files.
 */
function parseTarballListing(stdout: string): string[] {
  // Try structured JSON first
  try {
    const json = JSON.parse(stdout) as {
      files?: Array<{ path: string }>;
      bundled?: string[];
    };
    if (Array.isArray(json.files)) {
      return json.files.map((f) => f.path);
    }
    if (Array.isArray(json.bundled)) {
      return json.bundled;
    }
  } catch {
    // not JSON — parse npm notice lines
  }

  // Fallback: "npm notice   1.2kB  dist/index.js"
  const listing: string[] = [];
  for (const line of stdout.split("\n")) {
    const m = line.match(/npm notice\s+[\d.]+\w+\s+(.+)/);
    if (m?.[1]) listing.push(m[1].trim());
  }
  return listing;
}

/**
 * Estimate Vercel Sandbox cost.
 * Paid tier: $0.18/CPU-hour = 0.3 cents/CPU-min. Hobby: 5h CPU/month free.
 * Uses wallclock duration as proxy for CPU time (conservative upper bound).
 */
function estimateCostCents(durationMs: number): number {
  const minutes = durationMs / 1000 / 60;
  // $0.18/CPU-hour → 0.3 cents/min
  return Math.round(minutes * 0.3 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { sha, pkg, runtime, timeoutMs } = parseArgs(process.argv);
  const { token, source } = resolveCredentials();
  const startMs = Date.now();
  const builtAt = new Date().toISOString();
  const sandboxName = `mosaic-precheck-${sha.slice(0, 8)}-${Date.now()}`;

  log(`Starting sandbox precheck — sha=${sha} pkg=${pkg} runtime=${runtime} auth=${source}`);
  log(`Sandbox name: ${sandboxName}`);

  // Global timeout via AbortController
  const globalAbort = new AbortController();
  const globalTimer = setTimeout(() => {
    globalAbort.abort();
  }, timeoutMs);

  let sandbox: Sandbox | undefined;

  try {
    // -----------------------------------------------------------------------
    // Step 1: Spawn sandbox
    // -----------------------------------------------------------------------
    log("Spawning Vercel Sandbox...");

    try {
      sandbox = await Sandbox.create({
        name: sandboxName,
        runtime,
        timeout: timeoutMs,
        token,
        // Source: we clone manually inside the sandbox for precise SHA control
      });
    } catch (err) {
      clearTimeout(globalTimer);
      const details = err instanceof Error ? err.message : String(err);
      printError({
        status: "aborted",
        reason: `spawn_failed: ${details}`,
        recovery_suggestion:
          "Check VERCEL_OIDC_TOKEN validity and Vercel plan limits. Hobby plan allows 5h CPU/month.",
        exitCode: 2,
      });
      process.exit(2);
    }

    const sandboxId = `sb_${sandbox.name}`;
    log(`Sandbox spawned: ${sandboxId}`);

    // -----------------------------------------------------------------------
    // Step 2: Clone repo at specific SHA
    // -----------------------------------------------------------------------
    log(`Cloning vantageos-agency/vantage-mosaic @ ${sha}...`);

    const cloneCmd = await sandbox.runCommand("sh", [
      "-c",
      [
        "git clone https://github.com/vantageos-agency/vantage-mosaic.git /workspace --depth=50 2>&1",
        `cd /workspace && git checkout ${sha} 2>&1`,
      ].join(" && "),
    ]);

    const cloneStdout = await cloneCmd.stdout();
    const cloneStderr = await cloneCmd.stderr();

    log(`Clone exit code: ${cloneCmd.exitCode}`);

    if (cloneCmd.exitCode !== 0) {
      await teardown(sandbox);
      clearTimeout(globalTimer);

      const result: PreCheckResult = {
        pass: false,
        sandboxId,
        sha,
        ratio: "tests 0/0 PASS",
        tarballListing: [],
        tarballSha256: "",
        builtAt,
        durationMs: Date.now() - startMs,
        estimatedCostCents: estimateCostCents(Date.now() - startMs),
        error: "clone_failed",
        details: `${cloneStdout}\n${cloneStderr}`.slice(0, 2000),
      };

      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exit(3);
    }

    // -----------------------------------------------------------------------
    // Step 3: corepack enable + pnpm install --frozen-lockfile
    // -----------------------------------------------------------------------
    log("Enabling corepack and installing dependencies...");

    const installCmd = await sandbox.runCommand("sh", [
      "-c",
      ["corepack enable 2>&1", "cd /workspace && pnpm install --frozen-lockfile 2>&1"].join(" && "),
    ]);

    const installStdout = await installCmd.stdout();
    const installStderr = await installCmd.stderr();
    log(`Install exit code: ${installCmd.exitCode}`);

    if (installCmd.exitCode !== 0) {
      await teardown(sandbox);
      clearTimeout(globalTimer);

      const result: PreCheckResult = {
        pass: false,
        sandboxId,
        sha,
        ratio: "tests 0/0 PASS",
        tarballListing: [],
        tarballSha256: "",
        builtAt,
        durationMs: Date.now() - startMs,
        estimatedCostCents: estimateCostCents(Date.now() - startMs),
        error: "install_failed",
        details: `${installStdout}\n${installStderr}`.slice(0, 2000),
      };

      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exit(1);
    }

    // -----------------------------------------------------------------------
    // Step 4: pnpm --filter @vantageos/mosaic build
    // -----------------------------------------------------------------------
    log(`Building ${pkg}...`);

    const buildCmd = await sandbox.runCommand("sh", [
      "-c",
      `cd /workspace && pnpm --filter "${pkg}" build 2>&1`,
    ]);

    const buildStdout = await buildCmd.stdout();
    const buildStderr = await buildCmd.stderr();
    log(`Build exit code: ${buildCmd.exitCode}`);

    if (buildCmd.exitCode !== 0) {
      await teardown(sandbox);
      clearTimeout(globalTimer);

      const result: PreCheckResult = {
        pass: false,
        sandboxId,
        sha,
        ratio: "tests 0/0 PASS",
        tarballListing: [],
        tarballSha256: "",
        builtAt,
        durationMs: Date.now() - startMs,
        estimatedCostCents: estimateCostCents(Date.now() - startMs),
        error: "build_failed",
        details: `${buildStdout}\n${buildStderr}`.slice(0, 2000),
      };

      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exit(1);
    }

    // -----------------------------------------------------------------------
    // Step 5: pnpm --filter @vantageos/mosaic test
    // -----------------------------------------------------------------------
    log(`Running tests for ${pkg}...`);

    const testCmd = await sandbox.runCommand("sh", [
      "-c",
      `cd /workspace && pnpm --filter "${pkg}" test 2>&1`,
    ]);

    const testStdout = await testCmd.stdout();
    const testStderr = await testCmd.stderr();
    const ratio = parseTestRatio(testStdout, testStderr);
    log(`Test exit code: ${testCmd.exitCode} | ratio: ${ratio}`);

    if (testCmd.exitCode !== 0) {
      await teardown(sandbox);
      clearTimeout(globalTimer);

      const result: PreCheckResult = {
        pass: false,
        sandboxId,
        sha,
        ratio,
        tarballListing: [],
        tarballSha256: "",
        builtAt,
        durationMs: Date.now() - startMs,
        estimatedCostCents: estimateCostCents(Date.now() - startMs),
        error: "test_failed",
        details: `${testStdout}\n${testStderr}`.slice(0, 2000),
      };

      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exit(1);
    }

    // -----------------------------------------------------------------------
    // Step 6: npm publish --dry-run --json → parse tarball listing
    // -----------------------------------------------------------------------
    log("Running npm publish --dry-run...");

    // npm publish --dry-run must run inside the package directory
    const dryRunCmd = await sandbox.runCommand("sh", [
      "-c",
      "cd /workspace/packages/mosaic && npm publish --dry-run --json 2>&1",
    ]);

    const dryRunStdout = await dryRunCmd.stdout();
    const dryRunStderr = await dryRunCmd.stderr();
    log(`Dry-run exit code: ${dryRunCmd.exitCode}`);

    if (dryRunCmd.exitCode !== 0) {
      await teardown(sandbox);
      clearTimeout(globalTimer);

      const result: PreCheckResult = {
        pass: false,
        sandboxId,
        sha,
        ratio,
        tarballListing: [],
        tarballSha256: "",
        builtAt,
        durationMs: Date.now() - startMs,
        estimatedCostCents: estimateCostCents(Date.now() - startMs),
        error: "dry_run_failed",
        details: `${dryRunStdout}\n${dryRunStderr}`.slice(0, 2000),
      };

      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exit(1);
    }

    const tarballListing = parseTarballListing(dryRunStdout);
    log(`Tarball listing: ${tarballListing.length} files`);

    // -----------------------------------------------------------------------
    // Step 7: Compute tarball SHA256
    // Hash over sorted listing + raw dry-run stdout for cross-run stability
    // on the same SHA (reproducibility guarantee).
    // -----------------------------------------------------------------------
    const tarballSha256 = sha256(
      JSON.stringify({ sha, listing: [...tarballListing].sort() }) + dryRunStdout,
    );
    log(`Tarball SHA256: ${tarballSha256.slice(0, 16)}...`);

    // -----------------------------------------------------------------------
    // Step 8: Teardown sandbox
    // -----------------------------------------------------------------------
    await teardown(sandbox);
    clearTimeout(globalTimer);

    const durationMs = Date.now() - startMs;
    const result: PreCheckResult = {
      pass: true,
      sandboxId,
      sha,
      ratio,
      tarballListing,
      tarballSha256,
      builtAt,
      durationMs,
      estimatedCostCents: estimateCostCents(durationMs),
    };

    log(`Precheck PASS — ${durationMs}ms | cost ~${result.estimatedCostCents} cents`);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(0);
  } catch (err) {
    clearTimeout(globalTimer);

    // Check if it was our global abort (timeout)
    if (globalAbort.signal.aborted) {
      if (sandbox) await teardown(sandbox).catch(() => undefined);

      const durationMs = Date.now() - startMs;
      printError({
        status: "aborted",
        reason: `Global timeout exceeded (${durationMs}ms elapsed).`,
        recovery_suggestion: "Check for slow network or build steps.",
        exitCode: 4,
      });
      process.exit(4);
    }

    // Unexpected error
    if (sandbox) await teardown(sandbox).catch(() => undefined);

    const details = err instanceof Error ? err.message : String(err);
    printError({
      status: "aborted",
      reason: `Unexpected error: ${details}`,
      recovery_suggestion: "Check VERCEL credentials and network access.",
      exitCode: 2,
    });
    process.exit(2);
  }
}

async function teardown(sandbox: Sandbox): Promise<void> {
  log(`Tearing down sandbox ${sandbox.name}...`);
  try {
    await sandbox.stop();
    log("Sandbox stopped.");
  } catch (err) {
    log(`Warning: sandbox stop failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

main();
