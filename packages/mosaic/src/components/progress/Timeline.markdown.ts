import { t } from "../../i18n/strings.js";
import { formatTimestamp } from "../shared/datetime.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { TimelinePropsSchema } from "./Timeline.schema.js";

/** A-1 fallback: every step as an ordered list with its status, description and time. */
export function timelineToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const parsed = TimelinePropsSchema.safeParse(props);
  const title = mdHeading(t("Timeline.title", locale));
  if (!parsed.success || parsed.data.steps.length === 0) {
    return `${title}\n\n${t("Timeline.empty.message", locale)}\n`;
  }
  const { steps, timeZone } = parsed.data;
  const lines = steps.map((s, i) => {
    const status = t(`Timeline.status.${s.status}`, locale);
    const extras = [
      s.description ? mdEscape(s.description) : "",
      s.timestamp ? mdEscape(formatTimestamp(s.timestamp, locale, timeZone)) : "",
    ].filter(Boolean);
    return `${i + 1}. [${status}] ${mdEscape(s.title)}${extras.length ? ` - ${extras.join(" - ")}` : ""}`;
  });
  return `${title}\n\n${lines.join("\n")}\n`;
}
