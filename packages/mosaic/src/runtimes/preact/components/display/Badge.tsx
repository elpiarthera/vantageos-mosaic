// i18nKeys: Badge.error.invalidProps
/** @jsxImportSource preact */
import {
  SIZE_CLASSES,
  VARIANT_CLASSES,
  resolveAriaLabel,
  resolveContent,
} from "../../../../components/display/Badge.logic.js";
import { validateBadgeProps } from "../../../../components/display/Badge.schema.js";

type BadgeLocale = "en" | "fr";

const ERROR_MESSAGES: Record<BadgeLocale, string> = {
  en: "Badge: invalid props",
  fr: "Badge : propriétés invalides",
};

function pickLocale(raw: Record<string, unknown>): BadgeLocale {
  return raw.locale === "fr" ? "fr" : "en";
}

interface BadgeInnerProps {
  variant: "default" | "primary" | "secondary" | "outline";
  size: "sm" | "md" | "lg";
  content: string | number;
  ariaLabel?: string;
}

function BadgeInner({ variant, size, content, ariaLabel }: BadgeInnerProps) {
  const displayText = resolveContent(content);
  const resolvedAriaLabel = resolveAriaLabel(content, ariaLabel);

  return (
    <span
      aria-label={resolvedAriaLabel}
      class={`inline-flex items-center rounded-full font-tabular-nums ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`}
    >
      {displayText}
    </span>
  );
}

/**
 * Badge — Preact 10 runtime implementation.
 *
 * Structural parity with React runtime (Badge.react.tsx).
 * Uses `class` instead of `className` per Preact JSX convention.
 * tsup esbuildOptions aliases `react` → `preact/compat` at build time.
 *
 * @example
 * ```tsx
 * <Badge content="New" variant="primary" size="sm" />
 * <Badge content={42} aria-label="42 notifications" />
 * ```
 */
export function Badge(raw: Record<string, unknown>) {
  try {
    const props = validateBadgeProps(raw);
    return (
      <BadgeInner
        variant={props.variant}
        size={props.size}
        content={props.content}
        ariaLabel={props["aria-label"]}
      />
    );
  } catch {
    const locale = pickLocale(raw);
    return <span role="alert">{ERROR_MESSAGES[locale]}</span>;
  }
}
