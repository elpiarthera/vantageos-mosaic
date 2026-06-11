import { z } from "zod";

// i18nKeys: Skeleton.error.invalidProps

/**
 * Skeleton component props schema.
 *
 * variant  — shape of the placeholder:
 *            "rect"   → rectangular block (default)
 *            "circle" → circular avatar / icon placeholder
 *            "text"   → single or multi-line text placeholder
 *
 * width / height — CSS values (string) or pixels (number).
 *   "rect" defaults: width="100%", height=100
 *   "circle" defaults: width=height (equal, square rendered as circle)
 *   "text" defaults: width="100%", height=16
 *
 * count  — number of text line spans (only meaningful for variant="text").
 *          Default 1. Ignored for rect/circle.
 *
 * animation — shimmer style:
 *   "pulse" → opacity pulse (default)
 *   "wave"  → left-to-right gradient sweep
 *   "none"  → static placeholder (auto-selected when prefers-reduced-motion)
 */
export const SkeletonPropsSchema = z.object({
  variant: z.enum(["rect", "circle", "text"]).default("rect"),
  width: z.union([z.string().min(1), z.number().positive()]).optional(),
  height: z.union([z.string().min(1), z.number().positive()]).optional(),
  count: z.number().int().min(1).max(20).default(1),
  animation: z.enum(["pulse", "wave", "none"]).default("pulse"),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type SkeletonProps = z.infer<typeof SkeletonPropsSchema>;

export function validateSkeletonProps(raw: unknown): SkeletonProps {
  return SkeletonPropsSchema.parse(raw);
}

/**
 * Resolve final width/height CSS values given the variant and raw props.
 * Centralised here so React + Preact runtimes share identical defaults.
 */
export function resolveSkeletonDimensions(
  variant: SkeletonProps["variant"],
  width: SkeletonProps["width"],
  height: SkeletonProps["height"],
): { widthCss: string; heightCss: string } {
  const toCss = (v: string | number | undefined, fallback: string): string => {
    if (v === undefined) return fallback;
    if (typeof v === "number") return `${v}px`;
    return v;
  };

  if (variant === "circle") {
    const size =
      width !== undefined
        ? toCss(width, "40px")
        : height !== undefined
          ? toCss(height, "40px")
          : "40px";
    return { widthCss: size, heightCss: size };
  }

  if (variant === "text") {
    return {
      widthCss: toCss(width, "100%"),
      heightCss: toCss(height, "16px"),
    };
  }

  // rect (default)
  return {
    widthCss: toCss(width, "100%"),
    heightCss: toCss(height, "100px"),
  };
}
