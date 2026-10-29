import { t } from "../../i18n/strings.js";
import { columnText, formatValue } from "../shared/format.js";
import { mdEscape, mdHeading, mdTable } from "../shared/markdown.js";
import { DetailViewPropsSchema } from "./DetailView.schema.js";

/**
 * A-1 fallback: the record as markdown (heading, one block per section with `- **label**: value`
 * lines, nested tables as GFM). Pure; shares the schema and the formatter with the view.
 */
export function detailViewToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const parsed = DetailViewPropsSchema.safeParse(props);
  const heading = mdHeading(t("DetailView.title", locale));
  if (!parsed.success || (parsed.data.title === "" && parsed.data.sections.length === 0)) {
    return `${heading}\n\n${t("DetailView.empty.message", locale)}\n`;
  }
  const p = parsed.data;
  const out: string[] = [p.title ? mdHeading(mdEscape(p.title)) : heading];
  for (const s of p.sections) {
    out.push(`\n${mdHeading(mdEscape(s.title), 2)}\n`);
    for (const f of s.fields) {
      out.push(`- **${mdEscape(f.label)}**: ${mdEscape(formatValue(f.value, f.format, locale))}`);
    }
    if (s.table) {
      const rows = s.table.rows.map((r) =>
        s.table ? s.table.columns.map((c) => mdEscape(columnText(r, c, locale))) : [],
      );
      out.push(
        `\n${mdTable(
          s.table.columns.map((c) => mdEscape(c.header)),
          rows,
        )}`,
      );
    }
  }
  return `${out.join("\n")}\n`;
}
