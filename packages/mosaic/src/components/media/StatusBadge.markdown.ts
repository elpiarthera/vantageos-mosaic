import { t } from "../../i18n/strings.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { StatusBadgePropsSchema } from "./StatusBadge.schema.js";

/** A-1 fallback: the status text and its variant in words. */
export function statusBadgeToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const p = StatusBadgePropsSchema.parse({ locale, ...(props as object) });
  return `${mdHeading(t("StatusBadge.title", locale))}\n\n- ${mdEscape(p.label ?? p.status)} (${p.variant})\n`;
}
