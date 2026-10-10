/**
 * Markdown building blocks for the A-1 fallback of every view (pure strings, no React).
 * The text goes into a tool result `content[]` block that the MODEL reads: every untrusted
 * string must come out as inert text. Newlines collapse, markdown and HTML significant
 * characters are backslash-escaped, block markers at the start are neutralised, and URLs go
 * through {@link mdUrl} after being parsed (see `normalizeHttpUrl`).
 */

// Backslash-escaped (CommonMark: each renders as the literal character): \ ` * _ [ ] ( ) < > & ! | ~
const SPECIAL = /([\\`*_[\]()<>&!|~])/g;
const BREAKS = new Set([10, 11, 12, 13, 0x85, 0x2028, 0x2029]);

/**
 * One pass: every run of line breaks becomes a single space; other C0 controls (tab kept) and
 * DEL are dropped. Done by code point so no control character sits in a regular expression.
 */
function flatten(text: string): string {
  let out = "";
  let gap = false;
  for (const c of text) {
    const n = c.codePointAt(0) ?? 0;
    if (BREAKS.has(n)) {
      gap = true;
      continue;
    }
    if (n < 32 && n !== 9) continue;
    if (n === 127) continue;
    if (gap) out += " ";
    gap = false;
    out += c;
  }
  return gap ? `${out} ` : out;
}

/** Inert inline text: safe in a table cell, a list item, a link label or a blockquote. */
export function mdEscape(text: string): string {
  const flat = flatten(text)
    .replace(SPECIAL, "\\$1")
    // break GFM autolink literals: a scheme or www. in plain text must not become a live link
    .replace(/\b(https?|ftp):\/\//gi, "$1:\\/\\/")
    .replace(/\bwww\./gi, (m) => `${m.slice(0, 3)}\\.`);
  return flat.replace(/^(\s*)([#>+-])/, "$1\\$2").replace(/^(\s*\d+)([.)])(?=\s|$)/, "$1\\$2");
}

/** A link destination: parentheses, brackets, backslash, angle brackets, backtick, whitespace encoded. */
export function mdUrl(href: string): string {
  return href.replace(
    /[()[\]\\<>`\s]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
  );
}

/** An inline code span that survives backticks inside the text; newlines collapse. */
export function mdCode(text: string): string {
  const flat = flatten(text);
  const longest = Math.max(0, ...(flat.match(/`+/g) ?? []).map((r) => r.length));
  const fence = "`".repeat(longest + 1);
  return `${fence} ${flat} ${fence}`;
}

export function mdTable(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}

export function mdHeading(text: string, level = 1): string {
  return `${"#".repeat(level)} ${text}`;
}
