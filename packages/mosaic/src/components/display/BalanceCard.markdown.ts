import { t } from "../../i18n/strings.js";
import { formatDecimalString } from "../shared/decimal.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { BalanceCardPropsSchema } from "./BalanceCard.schema.js";

/** A-1 fallback: `token: balance (network, testnet)` plus the full address, as markdown. */
export function balanceCardToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const parsed = BalanceCardPropsSchema.safeParse(props);
  const title = mdHeading(t("BalanceCard.title", locale));
  if (!parsed.success || (parsed.data.token === "" && parsed.data.balance === "")) {
    return `${title}\n\n${t("BalanceCard.empty.message", locale)}\n`;
  }
  const p = parsed.data;
  const where = [p.network, p.testnet ? t("BalanceCard.testnet", locale) : ""].filter(Boolean);
  const lines = [
    `- ${mdEscape(p.token)}: ${mdEscape(p.balance)}${where.length ? ` (${mdEscape(where.join(", "))})` : ""}`,
  ];
  if (p.usdValue) {
    lines.push(
      `- ${t("BalanceCard.value", locale)}: ${mdEscape(formatDecimalString(p.usdValue, locale, p.currency))}`,
    );
  }
  if (p.address) lines.push(`- ${t("BalanceCard.address", locale)}: \`${p.address}\``);
  if (p.tokenAddress) lines.push(`- ${t("BalanceCard.contract", locale)}: \`${p.tokenAddress}\``);
  return `${title}\n\n${lines.join("\n")}\n`;
}
