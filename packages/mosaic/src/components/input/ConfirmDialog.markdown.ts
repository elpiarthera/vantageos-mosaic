import { t } from "../../i18n/strings.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { ConfirmDialogPropsSchema } from "./ConfirmDialog.schema.js";

/** A-1 fallback: the question, then the two answers the dialog would have offered. */
export function confirmDialogToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const p = ConfirmDialogPropsSchema.parse(props);
  return `${mdHeading(t("ConfirmDialog.title", locale))}\n\n**${mdEscape(p.title)}**\n\n${mdEscape(p.message)}\n\n${t("ConfirmDialog.options", locale)}: ${mdEscape(p.confirmLabel)} / ${mdEscape(p.cancelLabel)}\n`;
}
