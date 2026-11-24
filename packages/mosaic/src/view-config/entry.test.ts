// @vitest-environment node
/**
 * The React-free `@vantageos/mosaic/view-config` entry.
 *
 * A server validates a view config without rendering it, so this entry must load with no UI
 * runtime installed. The test walks the runtime (value) import graph of the entry source and
 * requires its only bare dependency to be `zod`. Forms of a module reference, derived from the
 * TypeScript syntax kinds that can carry a specifier: import declaration, export-from
 * declaration, dynamic `import()`, `require()`. Type-only forms are erased by the compiler and
 * skipped; any other form, or an unresolvable relative path, fails the walk by name.
 * Positive control: the same walk over the `display` entry must reach `react`.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runtimeBareImports } from "../__tests__/runtime-imports.js";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const UI_RUNTIME = /^(react|react-dom|preact)(\/|$)/;

describe("@vantageos/mosaic/view-config entry", () => {
  const entrySrc = resolve(PKG, "src/view-config/index.ts");

  it("is declared in package.json exports with types, import and require", () => {
    const pkg = JSON.parse(readFileSync(resolve(PKG, "package.json"), "utf8"));
    expect(pkg.exports["./view-config"]).toEqual({
      types: "./dist/view-config.d.ts",
      import: "./dist/view-config.js",
      require: "./dist/view-config.cjs",
    });
  });

  it("is a tsup entry built from src/view-config/index.ts", async () => {
    const configs = (await import("../../tsup.config.js")).default as unknown as Array<{
      entry?: Record<string, string>;
      external?: string[];
    }>;
    const owner = configs.filter((c) => c.entry?.["view-config"] !== undefined);
    expect(owner).toHaveLength(1);
    expect(owner[0]?.entry?.["view-config"]).toBe("src/view-config/index.ts");
  });

  it("exports the parser surface, the same objects as ./display", async () => {
    // Path held in a variable so a missing entry fails this test, not the whole file.
    const entryPath = "./index.js";
    const entry = await import(/* @vite-ignore */ entryPath);
    const display = await import("../components/display/index.js");
    expect(typeof entry.parseViewConfig).toBe("function");
    expect(entry.parseViewConfig).toBe(display.parseViewConfig);
    expect(entry.assertViewConfig).toBe(display.assertViewConfig);
    expect(entry.ViewConfigError).toBe(display.ViewConfigError);
    expect(entry.ViewConfigSchema).toBe(display.ViewConfigSchema);
  });

  it("reaches no UI runtime: its only bare runtime import is zod", () => {
    expect([...runtimeBareImports(entrySrc)].sort()).toEqual(["zod"]);
  });

  it("positive control: the same walk over ./display reaches react", () => {
    const bare = [...runtimeBareImports(resolve(PKG, "src/components/display/index.ts"))];
    expect(bare.some((s) => UI_RUNTIME.test(s))).toBe(true);
  });
});
