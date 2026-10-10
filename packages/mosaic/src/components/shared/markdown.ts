/**
 * Markdown building blocks for the A-1 fallback of every view (pure strings, no React).
 * The text goes into a tool result `content[]` block read by clients with no UI layer.
 */

/** Escapes what breaks a GFM table cell or inline emphasis; newlines collapse to a space. */
export function mdEscape(text: string): string {
  return text
    .replace(/\r?\n/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/([|*_`])/g, "\\$1");
}

export function mdTable(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}

export function mdHeading(text: string, level = 1): string {
  return `${"#".repeat(level)} ${text}`;
}
