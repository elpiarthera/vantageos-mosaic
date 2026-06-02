import DOMPurify from "dompurify";
import { marked } from "marked";
// i18nKeys: MarkdownRenderer.aria.content, MarkdownRenderer.error.invalidProps, MarkdownRenderer.error.tooLong
import React from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { type MarkdownRendererProps, validateProps } from "./MarkdownRenderer.schema";

interface MarkdownRendererInnerProps {
  content: string;
  locale: "en" | "fr";
  maxLength: number;
  allowHtml: boolean;
}

const tooLongMessages: Record<"en" | "fr", string> = {
  en: "Content exceeds maximum length.",
  fr: "Le contenu dépasse la longueur maximale.",
};

function MarkdownRendererInner({
  content,
  locale,
  maxLength,
  allowHtml,
}: MarkdownRendererInnerProps) {
  if (content.length > maxLength) {
    return (
      <div role="alert" lang={locale}>
        {tooLongMessages[locale]}
      </div>
    );
  }

  // When allowHtml=false, strip raw HTML tags from source before parsing,
  // so user-supplied HTML is neutralised before marked converts markdown to HTML.
  const source = allowHtml ? content : content.replace(/<[^>]*>/g, "");
  const rawHtml = marked.parse(source, { async: false }) as string;
  // Always sanitize the marked output to prevent XSS from markdown-injected HTML.
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  const ariaLabel = locale === "fr" ? "Contenu formaté" : "Formatted content";

  return (
    <article
      aria-label={ariaLabel}
      lang={locale}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

/**
 * MarkdownRenderer accepts any props object for JSX and MCP postMessage injection alike.
 * Internal Zod validation narrows the type — invalid data renders an accessible error fallback.
 */
export function MarkdownRenderer(raw: Record<string, unknown>) {
  try {
    const props = validateProps(raw);
    return <MarkdownRendererInner {...props} />;
  } catch {
    const locale: MosaicLocale = raw.locale === "fr" ? "fr" : "en";
    return <div role="alert">{t("MarkdownRenderer.error.invalidProps", locale)}</div>;
  }
}
