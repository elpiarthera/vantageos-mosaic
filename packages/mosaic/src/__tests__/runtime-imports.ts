/**
 * Test helper: the bare specifiers a source entry reaches AT RUNTIME, following its relative value
 * imports through the source tree.
 *
 * Forms of a module reference, derived from the TypeScript syntax kinds that can carry a
 * specifier: import declaration, export-from declaration, dynamic `import()`, `require()`.
 * Type-only forms are erased by the compiler and skipped; any other form (import-equals, a
 * non-literal `import()`/`require()`), or an unresolvable relative path, throws by name, so an
 * unread module can never be read as "imports nothing".
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";

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
export function runtimeBareImports(entry: string): Set<string> {
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
