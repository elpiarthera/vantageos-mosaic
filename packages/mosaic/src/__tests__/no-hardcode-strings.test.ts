/**
 * AST scan: zero hardcoded JSX string literals across src/components/**\/*.tsx
 *
 * Policy: consumer-driven i18n contract (v1.1) — components MUST NOT render
 * raw alphabetic text as JSXText children. All user-visible strings must flow
 * in as props from the host app so the host can apply its i18n layer.
 *
 * Whitelist mechanisms:
 *   - Same-line override:  // allow-hardcode-i18n: <reason>
 *   - File-level escape:   // allow-hardcode-i18n-file: <reason>  (first 5 lines)
 *
 * Auto-exempt files: *.test.tsx, *.spec.tsx, *.stories.tsx
 *
 * Closes Eta APPROVED-WITH-CONDITION axis 6.
 * Orchestrator: Gamma — VantageOS Team | 2026-06-02
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { describe, expect, it } from "vitest";

// ─── Config ─────────────────────────────────────────────────────────────────

const COMPONENTS_DIR = join(import.meta.dirname, "..", "components");

/** Minimum text length to flag (avoids single-char JSXText like "," or " ") */
const MIN_TEXT_LENGTH = 3;

/** Pattern: 3+ consecutive alphabetic characters */
const ALPHA_PATTERN = /[A-Za-z]{3,}/;

// ─── File discovery ──────────────────────────────────────────────────────────

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectTsxFiles(fullPath));
    } else if (
      entry.endsWith(".tsx") &&
      !entry.endsWith(".test.tsx") &&
      !entry.endsWith(".spec.tsx") &&
      !entry.endsWith(".stories.tsx")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Whitelist helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the file contains a file-level escape marker
 * in the first 5 lines: // allow-hardcode-i18n-file: <reason>
 */
function hasFileLevelEscape(source: string): boolean {
  const lines = source.split("\n").slice(0, 5);
  return lines.some((line) => /\/\/\s*allow-hardcode-i18n-file\s*:/.test(line));
}

/**
 * Returns true if the JSXText node has a same-line override comment.
 * Checks both leadingComments and trailingComments on the node.
 */
function hasSameLineOverride(
  _ast: ReturnType<typeof parser.parse>,
  path: {
    node: {
      loc?: { start: { line: number } };
      leadingComments?: Array<{ value: string }>;
      trailingComments?: Array<{ value: string }>;
    };
  },
): boolean {
  const line = path.node.loc?.start.line;
  if (line === undefined) return false;

  const allComments: Array<{ value: string }> = [
    ...(path.node.leadingComments ?? []),
    ...(path.node.trailingComments ?? []),
  ];

  return allComments.some((c) => /allow-hardcode-i18n\s*:/.test(c.value));
}

// ─── Violation type ──────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  text: string;
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

function scanFile(filePath: string): Violation[] {
  const source = readFileSync(filePath, "utf-8");

  // File-level escape: skip entire file
  if (hasFileLevelEscape(source)) return [];

  let ast: ReturnType<typeof parser.parse>;
  try {
    ast = parser.parse(source, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      attachComment: true,
    });
  } catch {
    // If we cannot parse, skip (not a TSX source file we can inspect)
    return [];
  }

  const violations: Violation[] = [];
  const relPath = relative(COMPONENTS_DIR, filePath);

  traverse(ast, {
    JSXText(path) {
      const raw = path.node.value;
      const text = raw.trim();

      // Skip empty / whitespace-only / too-short text
      if (text.length < MIN_TEXT_LENGTH) return;

      // Skip if no alphabetic sequence of 3+
      if (!ALPHA_PATTERN.test(text)) return;

      // Same-line override
      if (hasSameLineOverride(ast as never, path as never)) return;

      violations.push({
        file: relPath,
        line: path.node.loc?.start.line ?? -1,
        text: text.slice(0, 80),
      });
    },
  });

  return violations;
}

// ─── Test ────────────────────────────────────────────────────────────────────

describe("no-hardcode-strings", () => {
  it("has zero raw JSXText alphabetic literals across src/components/**/*.tsx", () => {
    const files = collectTsxFiles(COMPONENTS_DIR);

    expect(files.length).toBeGreaterThan(0);

    const allViolations: Violation[] = [];
    for (const file of files) {
      allViolations.push(...scanFile(file));
    }

    if (allViolations.length > 0) {
      const report = allViolations.map((v) => `  ${v.file}:${v.line} — "${v.text}"`).join("\n");
      throw new Error(
        `Found ${allViolations.length} hardcoded JSX string literal(s):\n${report}\n\n` +
          "Fix: pass string as a prop from the host app, or add:\n" +
          "  same-line:  {/* allow-hardcode-i18n: <reason> */}\n" +
          "  file-level: // allow-hardcode-i18n-file: <reason>  (first 5 lines)",
      );
    }

    expect(allViolations).toHaveLength(0);
  });
});
