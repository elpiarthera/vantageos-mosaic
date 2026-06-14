// i18nKeys: Badge.aria.label, Badge.error.invalidProps

import React from "react";
import {
  type BadgeProps,
  validateBadgeProps,
} from "../../../../components/display/Badge.schema.js";
import { type MosaicLocale, t } from "../../../../i18n/strings.js";

type Variant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "neutral";

const variantClasses: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  primary: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300",
  success: "bg-green-100 text-green-800 ring-1 ring-green-300",
  warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  danger: "bg-red-100 text-red-800 ring-1 ring-red-300",
  info: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
  neutral: "bg-slate-100 text-slate-800 ring-1 ring-slate-300",
};

const dotClasses: Record<Variant, string> = {
  default: "bg-slate-400",
  primary: "bg-indigo-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
};

function BadgeInner({ label, variant, dot, count, locale }: BadgeProps) {
  const ariaLabel = t("Badge.aria.label", locale);
  const displayCount = count !== undefined ? ` (${count})` : "";
  return (
    <span
      aria-label={`${ariaLabel}: ${label}${displayCount}`}
      lang={locale}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {dot && (
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`} />
      )}
      {label}
      {count !== undefined && (
        <span aria-hidden="true" className="font-semibold tabular-nums">
          {count}
        </span>
      )}
    </span>
  );
}

/**
 * Badge — cross-runtime generic visual label primitive (React 19 implementation).
 *
 * Accepts `Record<string, unknown>` for MCP postMessage injection safety.
 * Zod validation narrows before render. Invalid props → accessible error span.
 *
 * WCAG-AA:
 * - `<span>` with explicit aria-label combining Badge label + locale
 * - Optional dot indicator is aria-hidden (decorative)
 * - Optional count is aria-hidden (included in aria-label via label string)
 * - `lang` attribute set to locale for correct AT language announcement
 *
 * Badge vs StatusBadge: Badge is the generic visual label primitive (variant + optional
 * dot/count); StatusBadge is the status-specific semantic one using <output>.
 *
 * Bilingue: EN/FR strings resolved via t() from i18n/strings — no hardcoded literals.
 * Target: 0.3.2 patch release.
 */
export function Badge(raw: Record<string, unknown>) {
  try {
    const props = validateBadgeProps(raw);
    return <BadgeInner {...props} />;
  } catch {
    const locale: MosaicLocale = raw.locale === "fr" ? "fr" : "en";
    return <span role="alert">{t("Badge.error.invalidProps", locale)}</span>;
  }
}
