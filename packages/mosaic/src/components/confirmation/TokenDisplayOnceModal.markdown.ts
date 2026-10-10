import { t } from "../../i18n/strings.js";
import { mdEscape, mdHeading } from "../shared/markdown.js";
import { TokenDisplayOnceModalPropsSchema } from "./TokenDisplayOnceModal.schema.js";

/**
 * A-1 fallback for a one-time secret. `content[]` text reaches the model's context, and an
 * audience annotation is only a hint hosts may ignore, so the VALUE IS NEVER WRITTEN HERE: the
 * fallback carries the name, scope, expiry and an issuer-supplied fingerprint, plus a fixed
 * sentence that the value is shown once in the app view only. (`token` is declared in
 * MOSAIC_NEVER_SERIALISE and asserted absent by createMosaicToolResult.)
 */
export function tokenDisplayOnceModalToMarkdown(
  props: unknown,
  locale: "en" | "fr" = "en",
): string {
  // `token` is omitted on purpose: the renderer never needs it and is fed props without it.
  const p = TokenDisplayOnceModalPropsSchema.omit({ token: true }).parse(props);
  const rows = [
    p.scope ? `- ${t("TokenDisplayOnceModal.field.scope", locale)}: ${mdEscape(p.scope)}` : "",
    p.expiresAt
      ? `- ${t("TokenDisplayOnceModal.field.expires", locale)}: ${mdEscape(p.expiresAt)}`
      : "",
    p.fingerprint
      ? `- ${t("TokenDisplayOnceModal.field.fingerprint", locale)}: ${mdEscape(p.fingerprint)}`
      : "",
  ].filter(Boolean);
  return `${mdHeading(t("TokenDisplayOnceModal.title", locale))}\n\n**${mdEscape(p.title)}**\n\n${rows.length ? `${rows.join("\n")}\n\n` : ""}${t("TokenDisplayOnceModal.notice.once", locale)}\n`;
}
