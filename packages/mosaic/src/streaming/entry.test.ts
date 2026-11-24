// @vitest-environment node
/**
 * The `@vantageos/mosaic/streaming` entry: the rxjs-backed postMessage stream, kept out of the
 * root entry because rxjs is an optional peer (see src/__tests__/root-entry-optional-peers.test.ts).
 * Positive pole: with rxjs installed, the stream is a real rxjs Observable that emits the payload
 * of each `mosaic.stream.chunk` message and ignores other messages.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Observable } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as root from "../index.js";
import { runtimeBareImports } from "../__tests__/runtime-imports.js";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("@vantageos/mosaic/streaming entry", () => {
  // Node environment (esbuild, loaded by the tsup config, refuses jsdom); the stream test
  // supplies its own `window` as a plain EventTarget.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is declared in package.json exports with types, import and require", () => {
    const pkg = JSON.parse(readFileSync(resolve(PKG, "package.json"), "utf8"));
    expect(pkg.exports["./streaming"]).toEqual({
      types: "./dist/streaming.d.ts",
      import: "./dist/streaming.js",
      require: "./dist/streaming.cjs",
    });
  });

  it("is a tsup entry built from src/streaming/index.ts", async () => {
    const configs = (await import("../../tsup.config.js")).default as unknown as Array<{
      entry?: Record<string, string>;
    }>;
    const owner = configs.filter((c) => c.entry?.streaming !== undefined);
    expect(owner).toHaveLength(1);
    expect(owner[0]?.entry?.streaming).toBe("src/streaming/index.ts");
  });

  it("loads rxjs at runtime and no UI runtime", () => {
    expect([...runtimeBareImports(resolve(PKG, "src/streaming/index.ts"))].sort()).toEqual([
      "rxjs",
    ]);
  });

  it("the root entry no longer exports createPostMessageObservable, and keeps the constant", () => {
    expect("createPostMessageObservable" in root).toBe(false);
    expect(root.MOSAIC_STREAM_CHUNK_TYPE).toBe("mosaic.stream.chunk");
  });

  it("emits the data of mosaic.stream.chunk messages as an rxjs Observable", async () => {
    // Path held in a variable so a missing entry fails this test, not the whole file.
    const entryPath = "./index.js";
    const { createPostMessageObservable, MOSAIC_STREAM_CHUNK_TYPE } = await import(
      /* @vite-ignore */ entryPath
    );
    const win = new EventTarget();
    vi.stubGlobal("window", win);
    const stream$ = createPostMessageObservable();
    expect(stream$).toBeInstanceOf(Observable);
    const got: unknown[] = [];
    const sub = stream$.subscribe((v: unknown) => got.push(v));
    win.dispatchEvent(
      new MessageEvent("message", { data: { type: MOSAIC_STREAM_CHUNK_TYPE, data: { a: 1 } } }),
    );
    win.dispatchEvent(new MessageEvent("message", { data: { type: "other", data: { b: 2 } } }));
    win.dispatchEvent(
      new MessageEvent("message", { data: { type: MOSAIC_STREAM_CHUNK_TYPE, params: { c: 3 } } }),
    );
    sub.unsubscribe();
    expect(got).toEqual([{ a: 1 }, { c: 3 }]);
  });
});
