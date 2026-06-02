// i18nKeys: StatusBadge.aria.status, StatusBadge.error.invalidProps
import React from "react";
import { validateProps } from "./StatusBadge.schema";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const variantClasses: Record<Variant, string> = {
  success: "bg-green-100 text-green-800 ring-1 ring-green-300",
  warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  danger: "bg-red-100 text-red-800 ring-1 ring-red-300",
  info: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
  neutral: "bg-slate-100 text-slate-800 ring-1 ring-slate-300",
};

interface StatusBadgeInnerProps {
  status: string;
  variant: Variant;
  label?: string;
  locale: "en" | "fr";
}

function StatusBadgeInner({ status, variant, label, locale }: StatusBadgeInnerProps) {
  const ariaLabel = label ?? status;
  return (
    <output
      aria-label={ariaLabel}
      lang={locale}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {label ?? status}
    </output>
  );
}

export function StatusBadge(raw: unknown) {
  try {
    const props = validateProps(raw);
    return <StatusBadgeInner {...props} />;
  } catch {
    return <span role="alert">StatusBadge: invalid props</span>;
  }
}
