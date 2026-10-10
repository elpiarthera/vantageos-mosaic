import { t } from "../../i18n/strings.js";
import { formatTimestamp } from "../shared/datetime.js";
import { mdEscape, mdHeading, mdUrl } from "../shared/markdown.js";
import { normalizeHttpUrl } from "../shared/url.js";
import { MessageFeedPropsSchema, latestMessages } from "./MessageFeed.schema.js";

/** A-1 fallback: each message as a blockquote with sender, time, channel, content, attachment. */
export function messageFeedToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const parsed = MessageFeedPropsSchema.safeParse(props);
  const title = mdHeading(t("MessageFeed.title", locale));
  if (!parsed.success || parsed.data.messages.length === 0) {
    return `${title}\n\n${t("MessageFeed.empty.message", locale)}\n`;
  }
  const { messages, maxItems, timeZone } = parsed.data;
  const { shown, total } = latestMessages(messages, maxItems);
  const lines = shown.map((m) => {
    const when = [formatTimestamp(m.timestamp, locale, timeZone), m.channel ?? ""]
      .filter(Boolean)
      .join(", ");
    const href = normalizeHttpUrl(m.attachmentUrl);
    const label = mdEscape(m.attachmentLabel ?? t("MessageFeed.attachment", locale));
    const attachment = m.attachmentUrl ? (href ? ` [${label}](${mdUrl(href)})` : ` ${label}`) : "";
    return `> **${mdEscape(m.sender)}** (${mdEscape(when)}): ${mdEscape(m.content)}${attachment}`;
  });
  const cut =
    shown.length < total
      ? `${t("MessageFeed.showing", locale).replace("{n}", String(shown.length)).replace("{total}", String(total))}\n\n`
      : "";
  return `${title}\n\n${cut}${lines.join("\n>\n")}\n`;
}
