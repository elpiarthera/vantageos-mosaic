// Gate 2 — React-only fixture must succeed on react/* import and on the root entry,
// and must FAIL on preact/* import (peer not installed).
// The consumer has react + react-dom only: every other optional peer (rxjs included) is absent.
import { strict as assert } from "node:assert";

// root entry — MUST succeed: the root is the React back-compat barrel and loads no other
// optional peer.
const root = await import("@vantageos/mosaic").catch((e) => {
  console.error("FAIL: root entry import errored in react-only fixture", e);
  process.exit(4);
});
assert.equal(typeof root.startSizeReporting, "function", "root entry lost startSizeReporting");

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
  console.error(
    "FAIL: preact/progress import succeeded in react-only fixture (peer not installed) — peerDeps optionality broken",
  );
  process.exit(3);
}

// streaming entry — MUST fail: it loads rxjs, which this consumer does not have.
let streamingImportFailed = false;
try {
  await import("@vantageos/mosaic/streaming");
} catch (e) {
  if (e?.code !== "ERR_MODULE_NOT_FOUND" || !String(e.message).includes("'rxjs'")) {
    console.error("FAIL: streaming import failed for a reason other than missing rxjs", e);
    process.exit(5);
  }
  streamingImportFailed = true;
}
if (!streamingImportFailed) {
  console.error("FAIL: streaming import succeeded in react-only fixture without rxjs");
  process.exit(6);
}

console.log(
  "PASS: react-only fixture — react/* and the root succeed, preact/* and streaming fail as expected",
);
