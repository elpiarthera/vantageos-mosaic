import { t } from "../../i18n/strings.js";
import { mdHeading } from "../shared/markdown.js";
import { MarkdownRendererPropsSchema } from "./MarkdownRenderer.schema.js";

/** A-1 fallback: the content IS markdown, so it is passed through (capped at `maxLength`). */
export function markdownRendererToMarkdown(props: unknown, locale: "en" | "fr" = "en"): string {
  const p = MarkdownRendererPropsSchema.parse({ locale, ...(props as object) });
  return `${mdHeading(t("MarkdownRenderer.title", locale))}\n\n${p.content.slice(0, p.maxLength)}\n`;
}
