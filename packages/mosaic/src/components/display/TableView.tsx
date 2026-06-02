// i18nKeys: TableView.aria.table, TableView.pagination.next, TableView.pagination.prev, TableView.empty.message, TableView.error.invalidProps

import { useVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { validateTableViewProps } from "./TableView.schema";
import type { StreamingTableViewProps, TableViewProps } from "./TableView.schema";

const OVERSCAN = 5;

/**
 * TableView — Static rows variant (primary API).
 *
 * Accepts `rows: Row[]` for already-fetched data — no rxjs required.
 * Activates TanStack Virtual v3 windowing when rows.length > virtualizeThreshold.
 * Zod-validates serialisable props; renders role="alert" fallback on failure.
 * Fully accessible: aria-rowcount, aria-label, scope="col".
 */
export function TableView<TRow extends Record<string, unknown> = Record<string, unknown>>(
  props: TableViewProps<TRow>,
) {
  // ── Zod validation (serialisable props only) ───────────────────────────────
  let validatedThreshold = 100;
  try {
    const validated = validateTableViewProps({
      columns: props.columns.map(({ key, header }) => ({ key, header })),
      virtualizeThreshold: props.virtualizeThreshold,
      ariaLabel: props.ariaLabel,
      locale: props.locale,
    });
    validatedThreshold = validated.virtualizeThreshold;
  } catch {
    const locale: MosaicLocale = props.locale === "fr" ? "fr" : "en";
    return <div role="alert">{t("TableView.error.invalidProps", locale)}</div>;
  }

  const isVirtual = props.rows.length > validatedThreshold;
  const resolvedLocale: MosaicLocale = props.locale === "fr" ? "fr" : "en";

  if (isVirtual) {
    return (
      <VirtualTable<TRow>
        rows={props.rows}
        columns={props.columns}
        ariaLabel={props.ariaLabel}
        locale={resolvedLocale}
      />
    );
  }

  return (
    <StaticTable<TRow>
      rows={props.rows}
      columns={props.columns}
      ariaLabel={props.ariaLabel}
      locale={resolvedLocale}
    />
  );
}

/**
 * StreamingTableView — Streaming rows variant (advanced, opt-in).
 *
 * Pattern 4 Streaming Hydration reference implementation.
 * Consumes an RxJS Observable<Row[]> for incremental row appending.
 * Consumers MUST install rxjs ^7.8.0 in their project.
 * Activates TanStack Virtual v3 windowing when rows.length > virtualizeThreshold.
 * Zod-validates serialisable props; renders role="alert" fallback on failure.
 * Fully accessible: aria-rowcount, aria-label, scope="col".
 */
export function StreamingTableView<TRow extends Record<string, unknown> = Record<string, unknown>>(
  props: StreamingTableViewProps<TRow>,
) {
  // ── Zod validation (serialisable props only) ───────────────────────────────
  let validatedThreshold = 100;
  try {
    const validated = validateTableViewProps({
      columns: props.columns.map(({ key, header }) => ({ key, header })),
      virtualizeThreshold: props.virtualizeThreshold,
      ariaLabel: props.ariaLabel,
      locale: props.locale,
    });
    validatedThreshold = validated.virtualizeThreshold;
  } catch {
    const locale: MosaicLocale = props.locale === "fr" ? "fr" : "en";
    return <div role="alert">{t("TableView.error.invalidProps", locale)}</div>;
  }

  return <StreamingTableViewInner<TRow> {...props} virtualizeThreshold={validatedThreshold} />;
}

// ── Inner implementation for streaming (rendered only after validation passes) ──

function StreamingTableViewInner<TRow extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  rows$,
  virtualizeThreshold = 100,
  ariaLabel,
  locale,
}: StreamingTableViewProps<TRow> & { virtualizeThreshold: number }) {
  const resolvedLocale: MosaicLocale = locale === "fr" ? "fr" : "en";
  const [rows, setRows] = useState<Partial<TRow>[]>([]);

  // Subscribe to the Observable and accumulate chunks
  useEffect(() => {
    setRows([]);
    const sub = rows$.subscribe((chunk) => {
      setRows((prev) => [...prev, ...chunk]);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [rows$]);

  const isVirtual = rows.length > virtualizeThreshold;

  if (isVirtual) {
    return (
      <VirtualTable<TRow>
        rows={rows}
        columns={columns}
        ariaLabel={ariaLabel}
        locale={resolvedLocale}
      />
    );
  }

  return (
    <StaticTable<TRow>
      rows={rows}
      columns={columns}
      ariaLabel={ariaLabel}
      locale={resolvedLocale}
    />
  );
}

// ── Static table (rows <= virtualizeThreshold) ────────────────────────────────

type TableContentProps<TRow extends Record<string, unknown>> = {
  rows: Partial<TRow>[];
  columns: TableViewProps<TRow>["columns"];
  ariaLabel: string;
  locale: MosaicLocale;
};

/** Renders a single cell — uses col.render if provided, else converts to string */
function renderCell<TRow extends Record<string, unknown>>(
  col: TableViewProps<TRow>["columns"][number],
  row: Partial<TRow>,
): React.ReactNode {
  if (col.render) {
    return col.render(row as TRow);
  }
  return String((row as Record<string, unknown>)[col.key] ?? "");
}

function StaticTable<TRow extends Record<string, unknown>>({
  rows,
  columns,
  ariaLabel,
  locale,
}: TableContentProps<TRow>) {
  const emptyMsg = t("TableView.empty.message", locale);
  return (
    <table
      aria-label={ariaLabel}
      aria-rowcount={rows.length}
      style={{ width: "100%", borderCollapse: "collapse" }}
    >
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} scope="col">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} aria-label={emptyMsg}>
              {emptyMsg}
            </td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => (
            <tr
              key={
                (row as Record<string, unknown>).id != null
                  ? String((row as Record<string, unknown>).id)
                  : `row-${rowIndex}`
              }
              aria-rowindex={rowIndex + 2}
            >
              {columns.map((col) => (
                <td key={col.key}>{renderCell(col, row)}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ── Virtual table (rows > virtualizeThreshold) — TanStack Virtual v3 ─────────

function VirtualTable<TRow extends Record<string, unknown>>({
  rows,
  columns,
  ariaLabel,
  // locale reserved for future virtual-mode empty/pagination strings
  locale: _locale,
}: TableContentProps<TRow>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    /* v8 ignore next 1 */
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback(() => 40, []),
    overscan: OVERSCAN,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      data-virtual="true"
      ref={scrollRef}
      style={{ height: 400, overflow: "auto", position: "relative" }}
    >
      <table
        aria-label={ariaLabel}
        aria-rowcount={rows.length}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          style={{
            height: `${totalSize}px`,
            position: "relative",
            display: "block",
          }}
        >
          {virtualItems.map((virtualRow) => {
            /* v8 ignore next */
            const row = rows[virtualRow.index] ?? ({} as Partial<TRow>);
            return (
              <tr
                key={
                  (row as Record<string, unknown>).id != null
                    ? String((row as Record<string, unknown>).id)
                    : `vrow-${virtualRow.index}`
                }
                aria-rowindex={virtualRow.index + 2}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "flex",
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ flex: 1 }}>
                    {renderCell(col, row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
