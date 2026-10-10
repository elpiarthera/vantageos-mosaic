import { t } from "../../i18n/strings.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { TokenDisplayOnceModalPropsSchema } from "./TokenDisplayOnceModal.schema.js";

/**
 * A-1 fallback: the warning and the token in a code span. The token is a SECRET: the server
 * helper marks this text block `annotations.audience: ["user"]` so it is for the user, not the
 * model transcript.
 */
export function tokenDisplayOnceModalToMarkdown(
  props: unknown,
  locale: "en" | "fr" = "en",
): string {
  const p = TokenDisplayOnceModalPropsSchema.parse(props);
  return `${mdHeading(t("TokenDisplayOnceModal.title", locale))}\n\n**${mdEscape(p.title)}**\n\n${mdEscape(p.warningMessage)}\n\n\`${p.token}\`\n`;
}
