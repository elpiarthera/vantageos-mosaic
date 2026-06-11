"use client";

// i18nKeys: Toast.aria.close, Toast.error.invalidProps

import { type KeyboardEvent, useEffect } from "react";
import {
  getAriaLive,
  getAriaRole,
  variantCloseClasses,
  variantContainerClasses,
  variantDescriptionClasses,
  variantTitleClasses,
} from "../../../../components/confirmation/Toast.logic.js";
import {
  type ToastProps,
  validateToastProps,
} from "../../../../components/confirmation/Toast.schema.js";
import { t } from "../../../../i18n/strings.js";

function ToastInner({ variant, title, description, duration, locale, onClose }: ToastProps) {
  const role = getAriaRole(variant);
  const ariaLive = getAriaLive(variant);

  useEffect(() => {
    if (duration === 0 || !onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && onClose) {
      onClose();
    }
  }

  const closeLabel = t("Toast.aria.close", locale);

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      onKeyDown={handleKeyDown}
      className={`relative flex items-start gap-3 rounded-md px-4 py-3 shadow-sm max-w-sm w-full ${variantContainerClasses[variant]}`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${variantTitleClasses[variant]}`}>{title}</p>
        {description && (
          <p className={`mt-0.5 text-xs leading-relaxed ${variantDescriptionClasses[variant]}`}>
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className={`shrink-0 rounded p-0.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 ${variantCloseClasses[variant]}`}
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
 * Toast — cross-runtime notification primitive (React 19 implementation).
 *
 * Accepts `Record<string, unknown>` for MCP postMessage injection safety.
 * Zod validation narrows before render. Invalid props → accessible error span.
 *
 * WCAG-AA:
 * - variant="error" → role="alert" + aria-live="assertive"
 * - all others     → role="status" + aria-live="polite"
 */
export function Toast(
  raw: Omit<ToastProps, "locale" | "duration"> & Partial<Pick<ToastProps, "locale" | "duration">>,
) {
  try {
    const parsed = validateToastProps(raw);
    return <ToastInner {...parsed} onClose={raw.onClose} />;
  } catch (err) {
    console.error("[Toast] Invalid props — component will not render.", err);
    const locale = (raw as Record<string, unknown>).locale === "fr" ? "fr" : "en";
    return <span role="alert">{t("Toast.error.invalidProps", locale)}</span>;
  }
}
