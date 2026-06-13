// i18nKeys: StatusBadge.aria.status, StatusBadge.error.invalidProps
/** @jsxImportSource preact */
import {
  type StatusBadgeProps,
  validateProps,
} from "../../../../components/media/StatusBadge.schema.js";
import { type MosaicLocale, t } from "../../../../i18n/strings.js";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const variantClasses: Record<Variant, string> = {
  success: "bg-green-100 text-green-800 ring-1 ring-green-300",
  warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  danger: "bg-red-100 text-red-800 ring-1 ring-red-300",
  info: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
  neutral: "bg-slate-100 text-slate-800 ring-1 ring-slate-300",
};

function StatusBadgeInner({ status, variant, label, locale }: StatusBadgeProps) {
  const ariaLabel = label ?? status;
  return (
    <output
      aria-label={ariaLabel}
      lang={locale}
      class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {label ?? status}
    </output>
  );
}

/**
 * StatusBadge — cross-runtime status indicator badge (Preact 10 implementation).
 *
 * Accepts `Record<string, unknown>` for MCP postMessage injection safety.
 * Zod validation narrows before render. Invalid props → accessible error span.
 *
 * WCAG-AA:
 * - `<output>` has implicit role="status" per ARIA spec §5.3.17
 * - aria-label from `label` prop (falls back to `status` string)
 * - `lang` attribute set to locale for correct AT language announcement
 *
 * Bilingue: EN/FR strings resolved via t() from i18n/strings — no hardcoded literals.
 */
export function StatusBadge(raw: Record<string, unknown>) {
  try {
    const props = validateProps(raw);
    return <StatusBadgeInner {...props} />;
  } catch {
    const locale: MosaicLocale = raw.locale === "fr" ? "fr" : "en";
    return <span role="alert">{t("StatusBadge.error.invalidProps", locale)}</span>;
  }
}
