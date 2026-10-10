import { t } from "../../i18n/strings.js";
import { formatTimestamp } from "../shared/datetime.js";
import { mdEscape, mdHeading, mdTable } from "../shared/markdown.js";
import { isHttpUrl } from "../shared/url.js";
import {
  type TransactionAmount,
  TransactionPreviewPropsSchema,
  hasPreviewContent,
} from "./TransactionPreview.schema.js";

const amt = (a: TransactionAmount) => `${a.value} ${a.symbol}`;

/**
 * A-1 fallback (mandatory for this view): the field table plus the sentence "NOT SIGNED -
 * preparation only". The sentence is present even when there is nothing to preview.
 */
export function transactionPreviewToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const title = mdHeading(t("TransactionPreview.title", locale));
  const notice = `**${t("TransactionPreview.notice", locale)}**`;
  const parsed = TransactionPreviewPropsSchema.safeParse(props);
  if (!parsed.success || !hasPreviewContent(parsed.data)) {
    return `${title}\n\n${notice}\n\n${t("TransactionPreview.empty.message", locale)}\n`;
  }
  const p = parsed.data;
  const rows: string[][] = [];
  const add = (key: Parameters<typeof t>[0], value: string | undefined) => {
    if (value) rows.push([t(key, locale), mdEscape(value)]);
  };
  add(
    "TransactionPreview.field.network",
    [p.network, p.testnet ? t("TransactionPreview.testnet", locale) : ""]
      .filter(Boolean)
      .join(", "),
  );
  add("TransactionPreview.field.from", p.from);
  add("TransactionPreview.field.to", p.to);
  if (p.amount) add("TransactionPreview.field.amount", amt(p.amount));
  if (p.quote) {
    add("TransactionPreview.field.sell", amt(p.quote.sell));
    add("TransactionPreview.field.buy", amt(p.quote.buy));
    if (p.quote.minReceived) add("TransactionPreview.field.minReceived", amt(p.quote.minReceived));
    if (p.quote.route) add("TransactionPreview.field.route", p.quote.route.join(" > "));
    if (p.quote.priceImpact) add("TransactionPreview.field.priceImpact", `${p.quote.priceImpact}%`);
  }
  if (p.fee) add("TransactionPreview.field.fee", amt(p.fee));
  if (p.expiresAt) {
    add("TransactionPreview.field.expires", formatTimestamp(p.expiresAt, locale, p.timeZone));
  }
  const sections = [
    `${title}\n\n${notice}`,
    mdTable([t(`TransactionPreview.kind.${p.kind}`, locale), ""], rows),
  ];
  if (p.simulation) {
    const msg = p.simulation.message ? ` - ${mdEscape(p.simulation.message)}` : "";
    sections.push(`${t(`TransactionPreview.simulation.${p.simulation.status}`, locale)}${msg}`);
  }
  if (p.warnings.length > 0) {
    sections.push(
      `${t("TransactionPreview.warnings", locale)}:\n${p.warnings.map((w) => `- ${mdEscape(w)}`).join("\n")}`,
    );
  }
  if (p.handoff && isHttpUrl(p.handoff.url)) {
    sections.push(`${t("TransactionPreview.handoff", locale)}: ${p.handoff.url}`);
  }
  return `${sections.join("\n\n")}\n`;
}
