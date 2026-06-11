// Gate 2 — React-only fixture must succeed on react/* import
// and must FAIL on preact/* import (peer not installed).
import { strict as assert } from "node:assert";

// react/* import — MUST succeed
const reactProgress = await import("@vantageos/mosaic/react/progress").catch((e) => {
  console.error("FAIL: react/progress import errored in react-only fixture", e);
  process.exit(2);
});
assert.ok(reactProgress, "react/progress import returned falsy");

// preact/* import — MUST fail (preact not in deps)
let preactImportFailed = false;
try {
  await import("@vantageos/mosaic/preact/progress");
} catch {
  preactImportFailed = true;
}
if (!preactImportFailed) {
  console.error("FAIL: preact/progress import succeeded in react-only fixture (peer not installed) — peerDeps optionality broken");
  process.exit(3);
}

console.log("PASS: react-only fixture — react/* succeeds, preact/* fails as expected");
