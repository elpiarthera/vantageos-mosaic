// @vitest-environment node
/**
 * The root entry `@vantageos/mosaic` loads no optional peer beyond its own runtime.
 *
 * The root is the React 19 back-compat barrel (README "Surface"), so it may load `react` and
 * `react-dom`. Every other peer marked optional in package.json `peerDependenciesMeta` is one a
 * React consumer may not have installed; if the root reaches one at runtime, `import
 * "@vantageos/mosaic"` throws ERR_MODULE_NOT_FOUND for that consumer.
 *
 * The domain is DERIVED: the optional peers are read from package.json, never listed here. The
 * walk follows the runtime (value) imports of the root source; type-only imports are erased and
 * do not count. Positive control: the same walk over the `forms` entry reaches `react-hook-form`,
 * an optional peer, so the walk can see one.
 *
 * The built-artifact form of this check is the Gate 2 react-only consumer fixture
 * (e2e/peer-resolution/react-only), which imports the packed root with only react + react-dom.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runtimeBareImports } from "./runtime-imports.js";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(readFileSync(resolve(PKG, "package.json"), "utf8")) as {
  peerDependenciesMeta: Record<string, { optional?: boolean }>;
};

/** The root's own runtime: a React consumer of the root has these. */
const ROOT_RUNTIME = new Set(["react", "react-dom"]);

const OPTIONAL_PEERS = Object.entries(pkg.peerDependenciesMeta)
  .filter(([, meta]) => meta.optional === true)
  .map(([name]) => name);

function optionalPeersReached(entry: string): string[] {
  const bare = [...runtimeBareImports(resolve(PKG, entry))];
  return OPTIONAL_PEERS.filter((peer) =>
    bare.some((spec) => spec === peer || spec.startsWith(`${peer}/`)),
  ).sort();
}

describe("root entry @vantageos/mosaic — optional peers", () => {
  it("reads a non-empty optional-peer domain from package.json", () => {
    expect(OPTIONAL_PEERS.length).toBeGreaterThan(0);
    for (const peer of ROOT_RUNTIME) expect(OPTIONAL_PEERS).toContain(peer);
  });

  it("loads no optional peer other than react / react-dom at runtime", () => {
    const outside = optionalPeersReached("src/index.ts").filter((p) => !ROOT_RUNTIME.has(p));
    expect(outside).toEqual([]);
  });

  it("positive control: the same walk over ./forms reaches react-hook-form", () => {
    expect(optionalPeersReached("src/components/forms/index.ts")).toContain("react-hook-form");
  });
});
