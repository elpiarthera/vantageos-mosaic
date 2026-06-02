import React from "react";
import { type ProgressBarProps, validateProps } from "./ProgressBar.schema.js";

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
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      tabIndex={0}
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
        ProgressBar: invalid props
      </div>
    );
  }
}
