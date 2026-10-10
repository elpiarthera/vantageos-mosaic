import { t } from "../../i18n/strings.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { StatCardPropsSchema } from "./StatCard.schema.js";

/**
 * A-1 fallback: the metric as markdown (label, value, unit, trend in words, change), for clients
 * with no UI layer. Pure; shares the schema defaults with the view.
 */
export function statCardToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const parsed = StatCardPropsSchema.safeParse(props);
  const title = mdHeading(t("StatCard.title", locale));
  if (!parsed.success || (parsed.data.label === "" && parsed.data.value === "")) {
    return `${title}\n\n${t("StatCard.empty.message", locale)}\n`;
  }
  const { label, value, unit, trend, change, description } = parsed.data;
  const amount = unit ? `${value} ${unit}` : value;
  const movement = [trend ? t(`StatCard.trend.${trend}`, locale) : "", change ?? ""]
    .filter(Boolean)
    .join(" ");
  const line = `- **${mdEscape(label)}**: ${mdEscape(amount)}${movement ? ` (${mdEscape(movement)})` : ""}`;
  return `${title}\n\n${line}\n${description ? `\n${mdEscape(description)}\n` : ""}`;
}
