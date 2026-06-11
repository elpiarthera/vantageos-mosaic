// i18nKeys: Skeleton.aria.label, Skeleton.error.invalidProps

/** @jsxRuntime classic */
/** @jsx h */
import { h } from "preact";
import {
  SKELETON_BG_CLASS,
  getAnimationClass,
  getVariantClass,
  lastLineWidth,
  textLineKey,
} from "../../../../components/display/Skeleton.logic.js";
import {
  type SkeletonProps,
  resolveSkeletonDimensions,
  validateSkeletonProps,
} from "../../../../components/display/Skeleton.schema.js";
import { t } from "../../../../i18n/strings.js";

function SkeletonInner({ variant, width, height, count, animation, locale }: SkeletonProps) {
  const { widthCss, heightCss } = resolveSkeletonDimensions(variant, width, height);
  const animClass = getAnimationClass(animation);
  const variantClass = getVariantClass(variant);
  const ariaLabel = t("Skeleton.aria.label", locale);
  const baseClass = `${SKELETON_BG_CLASS} ${variantClass} ${animClass}`.trim();

  if (variant === "text") {
    return (
      // biome-ignore lint/a11y/useSemanticElements: role="status" is the correct ARIA pattern for loading indicators; <output> conveys form output semantics which is incorrect here
      <div role="status" aria-label={ariaLabel} aria-busy="true" class="flex flex-col gap-2">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={textLineKey(i)}
            class={`block ${baseClass}`}
            style={{
              width: lastLineWidth(i, count, widthCss),
              height: heightCss,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      class={`block ${baseClass}`}
      style={{ width: widthCss, height: heightCss }}
    />
  );
}

/**
 * Skeleton — cross-runtime loading placeholder (Preact 10 implementation).
 *
 * Structurally identical to the React runtime; JSX differences:
 * - `class` instead of `className`
 * - Preact h/Fragment imports
 * - No "use client" directive (Preact runs in extension context)
 *
 * WCAG-AA: role="status" + aria-busy="true" + aria-label via t()
 */
export function Skeleton(raw: Record<string, unknown>) {
  try {
    const props = validateSkeletonProps(raw);
    return <SkeletonInner {...props} />;
  } catch {
    const locale = (raw as Record<string, unknown>).locale === "fr" ? "fr" : "en";
    return (
      <span role="alert" class="text-red-600 text-sm">
        {t("Skeleton.error.invalidProps", locale)}
      </span>
    );
  }
}
