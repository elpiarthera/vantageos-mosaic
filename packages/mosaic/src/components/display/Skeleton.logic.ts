/**
 * Skeleton.logic.ts — shared pure logic (no JSX, no runtime dependency).
 *
 * Used by both React 19 and Preact 10 runtime implementations.
 * Tests live in __tests__/Skeleton.logic.test.ts (co-located schema/logic layer).
 */

import type { SkeletonProps } from "./Skeleton.schema.js";

export type SkeletonAnimation = SkeletonProps["animation"];
export type SkeletonVariant = SkeletonProps["variant"];

/**
 * Returns the CSS class name(s) for the shimmer animation.
 *
 * "pulse" — Tailwind `animate-pulse` (opacity oscillation, reduced-motion safe via Tailwind)
 * "wave"  — custom keyframe class `skeleton-wave` (left-to-right gradient sweep)
 * "none"  — no animation class
 *
 * Note: "pulse" uses Tailwind's built-in `animate-pulse` which already respects
 * `prefers-reduced-motion: reduce` via the `motion-safe:` variant — no extra CSS needed.
 * For "wave" consumers must include the `.skeleton-wave` keyframe in their CSS.
 */
export function getAnimationClass(animation: SkeletonAnimation): string {
  switch (animation) {
    case "pulse":
      return "animate-pulse";
    case "wave":
      return "skeleton-wave";
    case "none":
      return "";
  }
}

/**
 * Returns the base layout class for the skeleton variant.
 *
 * "rect"   → rounded rectangle block
 * "circle" → rounded-full (perfect circle when width === height)
 * "text"   → rounded bar, slightly shorter height for text-line appearance
 */
export function getVariantClass(variant: SkeletonVariant): string {
  switch (variant) {
    case "rect":
      return "rounded-md";
    case "circle":
      return "rounded-full";
    case "text":
      return "rounded";
  }
}

/**
 * Base background class applied to all skeleton shapes.
 * Uses a neutral gray that works on light and dark surfaces.
 */
export const SKELETON_BG_CLASS = "bg-gray-200 dark:bg-gray-700";

/**
 * Generate a stable key for each text-line span using the line index.
 * Using `line-<index>` string is stable (not array index as key directly).
 */
export function textLineKey(index: number): string {
  return `skeleton-line-${index}`;
}

/**
 * For multi-line text skeletons, optionally narrow the last line to ~75%
 * to mimic a natural paragraph end. Returns width override CSS string or undefined.
 */
export function lastLineWidth(index: number, total: number, baseWidth: string): string {
  if (total > 1 && index === total - 1) {
    // Last line narrowed to 75% of the container (natural paragraph look)
    return "75%";
  }
  return baseWidth;
}
