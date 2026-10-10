import { t } from "../../i18n/strings.js";
import { mdEscape, mdHeading, mdTable } from "../shared/markdown.js";
import { TableViewPropsSchema } from "./TableView.schema.js";

/** Rows beyond this are summarised, not listed (a text client gets a readable table). */
export const MARKDOWN_MAX_ROWS = 50;

/** A-1 fallback: the table as GFM (headers + the first rows) with the count of the rest. */
export function tableViewToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const p = TableViewPropsSchema.parse(props);
  const shown = p.rows.slice(0, MARKDOWN_MAX_ROWS);
  const table = mdTable(
    p.columns.map((c) => mdEscape(c.header)),
    shown.map((r) => p.columns.map((c) => mdEscape(String(r[c.key] ?? "")))),
  );
  const rest = p.rows.length - shown.length;
  const more =
    rest > 0 ? `\n${t("TableView.markdown.more", locale).replace("{n}", String(rest))}\n` : "";
  const empty = p.rows.length === 0 ? `\n${t("TableView.empty.message", locale)}\n` : "";
  return `${mdHeading(t("TableView.title", locale))}\n\n${table}\n${more}${empty}`;
}
