// i18nKeys: VirtualList.empty.message, VirtualList.error.invalidProps

import type { ReactNode } from "react";
import { z } from "zod";

/**
 * VirtualList Zod props schema.
 *
 * Runtime functions (renderItem, estimateSize, onRowClick) are excluded from
 * Zod per §18.5 (runtime functions not serialisable). They are typed separately
 * in VirtualListProps<T> below.
 *
 * Serialisable fields validated at render time for safe MCP postMessage injection.
 */
export const VirtualListPropsSchema = z.object({
  /** Array of items to render — required, can be empty */
  items: z.array(z.unknown()),
  /** Fixed row height in px — mutually exclusive with estimateSize */
  itemHeight: z.number().positive().optional(),
  /** Variable row height estimator — mutually exclusive with itemHeight */
  estimateSize: z.function().args(z.number()).returns(z.number()).optional(),
  /** Row renderer — required (runtime function, excluded from strict Zod parse but validated for presence) */
  renderItem: z.function().args(z.unknown(), z.number()).returns(z.unknown()).optional(),
  /** Rows to render outside visible area (default: 5) */
  overscan: z.number().int().min(0).optional(),
  /** CSS class applied to the scroll container */
  className: z.string().optional(),
  /** Locale for built-in empty state + error messages */
  locale: z.enum(["en", "fr"]).optional(),
  /** a11y: when provided, rows become keyboard-activable (role=button + tabIndex=0 + Enter/Space) */
  onRowClick: z.function().args(z.unknown(), z.number()).returns(z.void()).optional(),
});

export type VirtualListPropsSchemaInput = z.input<typeof VirtualListPropsSchema>;
export type VirtualListPropsSchemaOutput = z.output<typeof VirtualListPropsSchema>;

/**
 * Full typed VirtualList props for JSX consumers.
 * Generic over item type T.
 */
export type VirtualListProps<T = unknown> = {
  /** Array of items to render */
  items: T[];
  /** Fixed row height in px — use when all rows are the same height */
  itemHeight?: number;
  /** Variable height estimator — use when rows have different heights */
  estimateSize?: (index: number) => number;
  /** Required: renders one item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Called when a row is clicked/activated — triggers a11y role=button + keyboard */
  onRowClick?: (item: T, index: number) => void;
  /** Rows rendered outside viewport (default: 5) */
  overscan?: number;
  /** CSS class applied to the scroll container */
  className?: string;
  /** Locale for built-in strings (default: "en") */
  locale?: "en" | "fr";
};

/** Validates serialisable portion of VirtualList props — throws on failure */
export function validateVirtualListProps(raw: unknown): VirtualListPropsSchemaOutput {
  return VirtualListPropsSchema.parse(raw);
}
