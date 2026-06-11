import { strict as assert } from "node:assert";

const preactProgress = await import("@vantageos/mosaic/preact/progress").catch((e) => {
  console.error("FAIL: preact/progress import errored in preact-only fixture", e);
  process.exit(2);
});
assert.ok(preactProgress, "preact/progress import returned falsy");

let reactImportFailed = false;
try {
  await import("@vantageos/mosaic/react/progress");
} catch {
  reactImportFailed = true;
}
if (!reactImportFailed) {
  console.error("FAIL: react/progress import succeeded in preact-only fixture (peer not installed) — peerDeps optionality broken");
  process.exit(3);
}

console.log("PASS: preact-only fixture — preact/* succeeds, react/* fails as expected");
