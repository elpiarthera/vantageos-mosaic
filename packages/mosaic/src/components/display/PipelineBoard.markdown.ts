import { t } from "../../i18n/strings.js";
import { formatDecimalString } from "../shared/decimal.js";
import { mdEscape, mdHeading, mdTable } from "../shared/markdown.js";
import { stageSummary } from "./PipelineBoard.logic.js";
import { PipelineBoardPropsSchema } from "./PipelineBoard.schema.js";

/** A-1 fallback: a stage x deal-count x total table, then the deals of each stage. */
export function pipelineBoardToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const parsed = PipelineBoardPropsSchema.safeParse(props);
  const title = mdHeading(t("PipelineBoard.title", locale));
  if (!parsed.success || parsed.data.stages.length === 0) {
    return `${title}\n\n${t("PipelineBoard.empty.message", locale)}\n`;
  }
  const { stages, currency } = parsed.data;
  const money = (v: string) => mdEscape(formatDecimalString(v, locale, currency));
  const table = mdTable(
    [
      t("PipelineBoard.col.stage", locale),
      t("PipelineBoard.col.deals", locale),
      t("PipelineBoard.total", locale),
    ],
    stages.map((s) => {
      const sum = stageSummary(s.deals);
      return [
        mdEscape(s.name),
        String(sum.count),
        sum.total === undefined ? "-" : money(sum.total),
      ];
    }),
  );
  const sections = stages
    .filter((s) => s.deals.length > 0)
    .map((s) => {
      const lines = s.deals.map((d) => {
        const amount = d.amount === undefined ? "" : ` (${money(d.amount)})`;
        const contact = d.contact ? ` - ${mdEscape(d.contact)}` : "";
        return `- ${mdEscape(d.title)}${amount}${contact}`;
      });
      return `${mdHeading(mdEscape(s.name), 2)}\n\n${lines.join("\n")}`;
    });
  return `${title}\n\n${table}\n${sections.length ? `\n${sections.join("\n\n")}\n` : ""}`;
}
