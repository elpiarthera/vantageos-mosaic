"use client";

// i18nKeys: MarkdownRenderer.aria.content, MarkdownRenderer.error.invalidProps, MarkdownRenderer.error.tooLong

import DOMPurify from "dompurify";
import { marked } from "marked";
import React from "react";
import {
  type MarkdownRendererProps,
  validateProps,
} from "../../../../components/artifacts/MarkdownRenderer.schema.js";
import { t } from "../../../../i18n/strings.js";

// ─── Inner (validated props) ──────────────────────────────────────────────────

function MarkdownRendererInner({ content, locale, maxLength, allowHtml }: MarkdownRendererProps) {
  if (content.length > maxLength) {
    return (
      <div role="alert" lang={locale}>
        {t("MarkdownRenderer.error.tooLong", locale)}
      </div>
    );
  }

  // When allowHtml=false, strip raw HTML tags from source before parsing,
  // so user-supplied HTML is neutralised before marked converts markdown to HTML.
  const source = allowHtml ? content : content.replace(/<[^>]*>/g, "");
  const rawHtml = marked.parse(source, { async: false }) as string;
  // Always sanitize the marked output to prevent XSS from markdown-injected HTML.
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  return (
    <article
      aria-label={t("MarkdownRenderer.aria.content", locale)}
      lang={locale}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

/**
 * MarkdownRenderer — cross-runtime markdown-to-HTML renderer (React 19 implementation).
 *
 * Accepts `Record<string, unknown>` for JSX and MCP postMessage injection alike.
 * Internal Zod validation narrows the type — invalid data renders an accessible error fallback.
 *
 * WCAG-AA:
 * - <article aria-label> — landmark with i18n label (EN/FR)
 * - <div role="alert" lang> — tooLong + invalidProps errors announce to screen readers
 * - DOMPurify sanitization prevents XSS; allowHtml=false (default) strips raw HTML first
 *
 * i18nKeys: MarkdownRenderer.aria.content, MarkdownRenderer.error.invalidProps,
 *            MarkdownRenderer.error.tooLong
 */
export function MarkdownRenderer(raw: Record<string, unknown>) {
  try {
    const props = validateProps(raw);
    return <MarkdownRendererInner {...props} />;
  } catch {
    const locale = raw.locale === "fr" ? "fr" : "en";
    return <div role="alert">{t("MarkdownRenderer.error.invalidProps", locale)}</div>;
  }
}
