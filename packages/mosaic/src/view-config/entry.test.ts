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
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const UI_RUNTIME = /^(react|react-dom|preact)(\/|$)/;

function resolveRelative(from: string, spec: string): string {
  const base = resolve(dirname(from), spec.replace(/\.js$/, ""));
  for (const c of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (existsSync(c)) return c;
  }
  throw new Error(`unresolvable import "${spec}" in ${from}`);
}

function isTypeOnlyImport(node: ts.ImportDeclaration): boolean {
  const clause = node.importClause;
  if (!clause) return false; // side-effect import: runtime
  if (clause.isTypeOnly) return true;
  if (clause.name) return false;
  const nb = clause.namedBindings;
  if (!nb) return false;
  if (ts.isNamespaceImport(nb)) return false;
  return nb.elements.length > 0 && nb.elements.every((e) => e.isTypeOnly);
}

function isTypeOnlyExport(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) return true;
  const ec = node.exportClause;
  if (!ec || !ts.isNamedExports(ec)) return false;
  return ec.elements.length > 0 && ec.elements.every((e) => e.isTypeOnly);
}

/** Bare specifiers reached at runtime from `entry`, following relative value imports. */
function runtimeBareImports(entry: string): Set<string> {
  const bare = new Set<string>();
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const take = (spec: string) => {
      if (spec.startsWith(".")) queue.push(resolveRelative(file, spec));
      else bare.add(spec);
    };
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        if (!isTypeOnlyImport(node)) take((node.moduleSpecifier as ts.StringLiteral).text);
        return;
      }
      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && !isTypeOnlyExport(node)) {
          take((node.moduleSpecifier as ts.StringLiteral).text);
        }
        return;
      }
      if (ts.isCallExpression(node)) {
        const isDynImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
        const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
        if (isDynImport || isRequire) {
          const arg = node.arguments[0];
          if (!arg || !ts.isStringLiteral(arg)) {
            throw new Error(`non-literal ${isRequire ? "require" : "import()"} in ${file}`);
          }
          take(arg.text);
        }
      }
      if (ts.isImportEqualsDeclaration(node)) {
        throw new Error(`import-equals declaration not handled in ${file}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(src);
  }
  return bare;
}

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
