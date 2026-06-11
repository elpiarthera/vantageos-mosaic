// i18nKeys: VirtualList.empty.message, VirtualList.error.invalidProps

import { useVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { useCallback, useRef } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { type VirtualListProps, validateVirtualListProps } from "./VirtualList.schema.js";

const DEFAULT_OVERSCAN = 5;
const DEFAULT_ITEM_HEIGHT = 40;

/**
 * VirtualList — generic virtualized list component.
 *
 * Cross-runtime: same file used by React 19 and Preact 10 (via preact/compat alias in tsup).
 * Virtualization: @tanstack/react-virtual v3 (already in mosaic deps via TableView).
 * a11y: WCAG-AA — when onRowClick provided, rows get role=button + tabIndex=0 + Enter/Space.
 * Zod-validated serialisable props; renders role="alert" fallback on failure.
 *
 * API:
 *   items: T[]                                     — generic item array
 *   itemHeight?: number                            — fixed px height (mutually exclusive with estimateSize)
 *   estimateSize?: (index) => number              — variable height estimator
 *   renderItem: (item, index) => ReactNode        — required row renderer
 *   onRowClick?: (item, index) => void            — a11y click handler
 *   overscan?: number                              — rows outside viewport (default: 5)
 *   className?: string                             — scroll container class
 *   locale?: "en" | "fr"                          — built-in string locale
 */
export function VirtualList<T = unknown>(props: VirtualListProps<T>) {
  // Validate serialisable props — functions excluded per §18.5
  try {
    validateVirtualListProps({
      items: props.items,
      itemHeight: props.itemHeight,
      overscan: props.overscan,
      className: props.className,
      locale: props.locale,
    });
  } catch {
    const locale: MosaicLocale = props.locale === "fr" ? "fr" : "en";
    return <div role="alert">{t("VirtualList.error.invalidProps", locale)}</div>;
  }

  const locale: MosaicLocale = props.locale === "fr" ? "fr" : "en";

  if (props.items.length === 0) {
    return <output aria-live="polite">{t("VirtualList.empty.message", locale)}</output>;
  }

  return (
    <VirtualListInner<T>
      items={props.items}
      itemHeight={props.itemHeight}
      estimateSize={props.estimateSize}
      renderItem={props.renderItem}
      onRowClick={props.onRowClick}
      overscan={props.overscan ?? DEFAULT_OVERSCAN}
      className={props.className}
      locale={locale}
    />
  );
}

// ── Inner implementation — rendered after validation passes ───────────────────

type VirtualListInnerProps<T> = Required<
  Pick<VirtualListProps<T>, "items" | "renderItem" | "overscan">
> &
  Pick<VirtualListProps<T>, "itemHeight" | "estimateSize" | "onRowClick" | "className"> & {
    locale: MosaicLocale;
  };

function VirtualListInner<T>({
  items,
  itemHeight,
  estimateSize,
  renderItem,
  onRowClick,
  overscan,
  className,
}: VirtualListInnerProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const resolvedEstimateSize = useCallback(
    (index: number): number => {
      if (estimateSize) return estimateSize(index);
      return itemHeight ?? DEFAULT_ITEM_HEIGHT;
    },
    [estimateSize, itemHeight],
  );

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    /* v8 ignore next 1 */
    getScrollElement: () => scrollRef.current,
    estimateSize: resolvedEstimateSize,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      data-virtual="true"
      ref={scrollRef}
      className={className}
      style={{ height: 400, overflow: "auto", position: "relative" }}
    >
      <div style={{ height: `${totalSize}px`, position: "relative" }}>
        {virtualItems.map((virtualRow) => {
          /* v8 ignore next */
          const item = items[virtualRow.index] as T;
          const index = virtualRow.index;

          const rowProps = onRowClick
            ? {
                role: "button" as const,
                tabIndex: 0,
                "data-list-row": true,
                style: {
                  position: "absolute" as const,
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  cursor: "pointer",
                },
                onClick: () => onRowClick(item, index),
                onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(item, index);
                  }
                },
              }
            : {
                "data-list-row": true,
                style: {
                  position: "absolute" as const,
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                },
              };

          return (
            <div key={virtualRow.key} {...rowProps}>
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
