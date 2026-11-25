import React from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { type ProgressBarProps, validateProps } from "./ProgressBar.schema.js";

function pickLocale(raw: Record<string, unknown>): MosaicLocale {
  return raw.locale === "fr" ? "fr" : "en";
}

const colorVariantClasses: Record<ProgressBarProps["colorVariant"], string> = {
  default: "bg-blue-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
};

const containerVariantClasses: Record<ProgressBarProps["colorVariant"], string> = {
  default: "progressbar-default",
  warning: "progressbar-warning",
  danger: "progressbar-danger",
};

function ProgressBarInner(props: ProgressBarProps) {
  const { value, label, colorVariant } = props;
  const fillClass = colorVariantClasses[colorVariant];
  const containerClass = containerVariantClasses[colorVariant];

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: a progressbar is read, not operated; WAI-ARIA APG gives it no keyboard interaction, and a tab stop that does nothing misleads keyboard users
    <div
      // react-doctor-disable-next-line react-doctor/prefer-tag-over-role -- native <progress> renders its children only as fallback content, so it cannot carry the colour-variant fill and the visible "label: value%" text this component draws
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`mosaic-progress ${containerClass}`}
      style={{ width: "100%" }}
    >
      <div
        data-testid="progress-fill"
        className={`mosaic-progress-fill ${fillClass}`}
        style={{ width: `${value}%` }}
      />
      <span className="mosaic-progress-label">
        {label}: {value}%
      </span>
    </div>
  );
}

/**
 * ProgressBar accepts any props object for JSX and MCP postMessage injection alike.
 * Internal Zod validation narrows the type — invalid data renders an accessible error fallback.
 */
export function ProgressBar(raw: Record<string, unknown>) {
  try {
    const props = validateProps(raw);
    return <ProgressBarInner {...props} />;
  } catch {
    return (
      <div role="alert" className="mosaic-progress-error">
        {t("ProgressBar.error.invalidProps", pickLocale(raw))}
      </div>
    );
  }
}
