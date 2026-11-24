// Gate 2 — React + rxjs fixture: the rxjs-backed entry @vantageos/mosaic/streaming MUST load
// when its optional peer rxjs is installed, and return a real rxjs Observable.
import { strict as assert } from "node:assert";
import { isObservable } from "rxjs";

const streaming = await import("@vantageos/mosaic/streaming").catch((e) => {
  console.error("FAIL: streaming import errored in react-rxjs fixture", e);
  process.exit(2);
});
assert.equal(streaming.MOSAIC_STREAM_CHUNK_TYPE, "mosaic.stream.chunk");
// No window in node: the stream is created without a listener, still an rxjs Observable.
const stream$ = streaming.createPostMessageObservable();
assert.ok(isObservable(stream$), "createPostMessageObservable did not return an rxjs Observable");

const root = await import("@vantageos/mosaic").catch((e) => {
  console.error("FAIL: root entry import errored in react-rxjs fixture", e);
  process.exit(4);
});
assert.equal(typeof root.startSizeReporting, "function", "root entry lost startSizeReporting");

console.log("PASS: react-rxjs fixture — streaming entry loads with rxjs and returns an Observable");
