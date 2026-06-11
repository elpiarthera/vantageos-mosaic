// i18nKeys: Skeleton.aria.label, Skeleton.error.invalidProps

import React from "react";
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
      <div role="status" aria-label={ariaLabel} aria-busy="true" className="flex flex-col gap-2">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={textLineKey(i)}
            className={`block ${baseClass}`}
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
      className={`block ${baseClass}`}
      style={{ width: widthCss, height: heightCss }}
    />
  );
}

/**
 * Skeleton — cross-runtime loading placeholder (React 19 implementation).
 *
 * Accepts `Record<string, unknown>` for MCP postMessage injection safety.
 * Zod validation narrows before render. Invalid props → accessible error span.
 *
 * Animation "none" is auto-applied when prefers-reduced-motion is set (via
 * Tailwind's animate-pulse which respects the media query natively), or by
 * passing animation="none" explicitly.
 *
 * WCAG-AA:
 * - role="status" + aria-busy="true" on the container
 * - aria-label resolves via t() in EN/FR
 * - aria-hidden="true" on individual line spans (status role covers the group)
 */
export function Skeleton(raw: Record<string, unknown>) {
  try {
    const props = validateSkeletonProps(raw);
    return <SkeletonInner {...props} />;
  } catch {
    const locale = (raw as Record<string, unknown>).locale === "fr" ? "fr" : "en";
    return (
      <span role="alert" className="text-red-600 text-sm">
        {t("Skeleton.error.invalidProps", locale)}
      </span>
    );
  }
}
