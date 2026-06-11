"use client";

// i18nKeys: Alert.aria.dismiss, Alert.error.invalidProps

import {
  alertContainerClasses,
  alertDescriptionClasses,
  alertDismissClasses,
  alertTitleClasses,
  getAlertAriaLive,
  getAlertAriaRole,
} from "../../../../components/confirmation/Alert.logic.js";
import {
  type AlertProps,
  validateAlertProps,
} from "../../../../components/confirmation/Alert.schema.js";
import { t } from "../../../../i18n/strings.js";

function AlertInner({ variant, title, description, dismissible, locale, onDismiss }: AlertProps) {
  const role = getAlertAriaRole(variant);
  const ariaLive = getAlertAriaLive(variant);
  const dismissLabel = t("Alert.aria.dismiss", locale);

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className={`relative flex items-start gap-3 rounded-md px-4 py-3 w-full ${alertContainerClasses[variant]}`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${alertTitleClasses[variant]}`}>{title}</p>
        {description && (
          <p className={`mt-1 text-xs leading-relaxed ${alertDescriptionClasses[variant]}`}>
            {description}
          </p>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className={`shrink-0 rounded p-0.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 ${alertDismissClasses[variant]}`}
        >
          {/* X icon — inline SVG, no external deps */}
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Alert — persistent inline banner (React 19 implementation).
 *
 * Contrast with Toast: Alert is PERSISTENT (no auto-dismiss), inline in the
 * document flow. Toast is ephemeral + portal-mounted.
 *
 * Accepts `Record<string, unknown>` for MCP postMessage injection safety.
 * Zod validation narrows before render. Invalid props → accessible error span.
 *
 * WCAG-AA:
 * - variant="error" → role="alert" + aria-live="assertive"
 * - all others     → role="status" + aria-live="polite"
 */
export function Alert(
  raw: Omit<AlertProps, "locale" | "dismissible"> &
    Partial<Pick<AlertProps, "locale" | "dismissible">>,
) {
  try {
    const parsed = validateAlertProps(raw);
    return <AlertInner {...parsed} onDismiss={raw.onDismiss} />;
  } catch (err) {
    console.error("[Alert] Invalid props — component will not render.", err);
    const locale = (raw as Record<string, unknown>).locale === "fr" ? "fr" : "en";
    return <span role="alert">{t("Alert.error.invalidProps", locale)}</span>;
  }
}
