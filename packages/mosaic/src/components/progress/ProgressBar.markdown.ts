import { t } from "../../i18n/strings.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { ProgressBarPropsSchema } from "./ProgressBar.schema.js";

/** A-1 fallback: the label and the percentage (plus a non-default colour variant in words). */
export function progressBarToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const p = ProgressBarPropsSchema.parse(props);
  const variant = p.colorVariant === "default" ? "" : ` (${p.colorVariant})`;
  return `${mdHeading(t("ProgressBar.title", locale))}\n\n- ${mdEscape(p.label)}: ${p.value}%${variant}\n`;
}
