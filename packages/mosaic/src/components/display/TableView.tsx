// i18nKeys: TableView.aria.table, TableView.pagination.next, TableView.pagination.prev, TableView.empty.message, TableView.error.invalidProps, TableView.sort.by, TableView.select.row, TableView.select.all, TableView.loading

import { useVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import {
  type ColumnKind,
  type SortState,
  nextSort,
  sortItems,
  toggleAll,
  toggleSelection,
} from "./TableView.logic";
import { validateTableViewProps } from "./TableView.schema";
import type { StreamingTableViewProps, TableViewProps } from "./TableView.schema";

const OVERSCAN = 5;
const SKELETON_ROWS = ["head", "r1", "r2", "r3", "r4", "r5"] as const;

type AnyRow = Record<string, unknown>;

/** Shared prop surface after validation: everything the table core needs. */
type CoreProps<TRow extends AnyRow> = Pick<
  TableViewProps<TRow>,
  | "columns"
  | "ariaLabel"
  | "onRowClick"
  | "selectionMode"
  | "selectedKeys"
  | "defaultSelectedKeys"
  | "onSelectionChange"
  | "sort"
  | "defaultSort"
  | "onSortChange"
  | "stickyHeader"
  | "maxHeight"
  | "density"
  | "loading"
> & {
  rows: Partial<TRow>[];
  virtualizeThreshold: number;
  locale: MosaicLocale;
};

function resolveLocale(l: string | undefined): MosaicLocale {
  return l === "fr" ? "fr" : "en";
}

function validate<TRow extends AnyRow>(
  props: Pick<
    TableViewProps<TRow>,
    "columns" | "virtualizeThreshold" | "ariaLabel" | "locale" | "selectionMode" | "density"
  >,
): number | undefined {
  try {
    const validated = validateTableViewProps({
      columns: props.columns.map(({ key, header, type, align, width, sortable }) => ({
        key,
        header,
        type,
        align,
        width,
        sortable,
      })),
      virtualizeThreshold: props.virtualizeThreshold,
      ariaLabel: props.ariaLabel,
      locale: props.locale,
      selectionMode: props.selectionMode,
      density: props.density,
    });
    return validated.virtualizeThreshold;
  } catch {
    return undefined;
  }
}

/**
 * TableView — Static rows variant (primary API).
 *
 * Accepts `rows: Row[]` for already-fetched data — no rxjs required.
 * Activates TanStack Virtual v3 windowing when rows.length > virtualizeThreshold.
 * Zod-validates serialisable props; renders role="alert" fallback on failure.
 * Fully accessible: aria-rowcount, aria-label, scope="col", aria-sort on sortable headers.
 *
 * R01 / R10 extension (additive, every new prop optional): sortable columns, single / multiple
 * selection, sticky header, compact density, column align / width, `amount` and `icon` cell kinds
 * and a Skeleton loading state. Claude inline cards want few rows and no nested scrolling:
 * keep inline summaries short and offer fullscreen for the full set.
 */
export function TableView<TRow extends AnyRow = AnyRow>(props: TableViewProps<TRow>) {
  const threshold = validate(props);
  if (threshold === undefined) {
    return <div role="alert">{t("TableView.error.invalidProps", resolveLocale(props.locale))}</div>;
  }
  return (
    <TableCore<TRow>
      {...props}
      rows={props.rows}
      virtualizeThreshold={threshold}
      locale={resolveLocale(props.locale)}
    />
  );
}

/**
 * StreamingTableView — Streaming rows variant (advanced, opt-in).
 *
 * Pattern 4 Streaming Hydration reference implementation.
 * Consumes an RxJS Observable<Row[]> for incremental row appending.
 * Consumers MUST install rxjs ^7.8.0 in their project.
 * Same extension props as TableView.
 */
export function StreamingTableView<TRow extends AnyRow = AnyRow>(
  props: StreamingTableViewProps<TRow>,
) {
  const threshold = validate(props);
  if (threshold === undefined) {
    return <div role="alert">{t("TableView.error.invalidProps", resolveLocale(props.locale))}</div>;
  }
  return <StreamingTableViewInner<TRow> {...props} virtualizeThreshold={threshold} />;
}

// ── Inner implementation for streaming (rendered only after validation passes) ──

function StreamingTableViewInner<TRow extends AnyRow = AnyRow>({
  rows$,
  ...rest
}: StreamingTableViewProps<TRow> & { virtualizeThreshold: number }) {
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

  return <TableCore<TRow> {...rest} rows={rows} locale={resolveLocale(rest.locale)} />;
}

// ── Table core: sort + selection state, then static or virtual rendering ──────

/** A row with its stable key (id, else ORIGINAL index) so selection survives re-sorting. */
type Item<TRow extends AnyRow> = { row: Partial<TRow>; key: string };

function kindOf(col: { type?: ColumnKind }): ColumnKind {
  return col.type ?? "text";
}

function alignOf(col: { type?: ColumnKind; align?: "start" | "center" | "end" }) {
  return col.align ?? (col.type === "amount" || col.type === "number" ? "end" : "start");
}

function cellText(row: AnyRow, key: string): string {
  return String(row[key] ?? "");
}

/** Only http(s) and data:image sources are rendered as icons. */
function safeIconSrc(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return /^(https?:\/\/|data:image\/)/i.test(v) ? v : undefined;
}

function renderCell<TRow extends AnyRow>(
  col: CoreProps<TRow>["columns"][number],
  row: Partial<TRow>,
): React.ReactNode {
  if (col.render) {
    return col.render(row as TRow);
  }
  const value = (row as AnyRow)[col.key];
  if (col.type === "icon") {
    const src = safeIconSrc(value);
    return src ? (
      <img src={src} alt="" width={20} height={20} style={{ verticalAlign: "middle" }} />
    ) : null;
  }
  if (col.type === "amount" || col.type === "number") {
    return <span style={{ fontVariantNumeric: "tabular-nums" }}>{String(value ?? "")}</span>;
  }
  return String(value ?? "");
}

function TableCore<TRow extends AnyRow>(props: CoreProps<TRow>) {
  const {
    columns,
    rows,
    ariaLabel,
    locale,
    selectionMode = "none",
    stickyHeader = false,
    density = "comfortable",
  } = props;

  // ── sort (controlled when `sort` is passed; null = controlled "unsorted") ──
  const [innerSort, setInnerSort] = useState<SortState | undefined>(props.defaultSort);
  const sort = props.sort === undefined ? innerSort : (props.sort ?? undefined);
  const onSort = (key: string) => {
    const next = nextSort(sort, key);
    if (props.sort === undefined) setInnerSort(next);
    props.onSortChange?.(next);
  };

  const items = useMemo<Item<TRow>[]>(
    () =>
      rows.map((row, i) => {
        const id = (row as AnyRow).id;
        return { row, key: id != null ? String(id) : `row-${i}` };
      }),
    [rows],
  );
  const sorted = useMemo(() => {
    const col = sort ? columns.find((c) => c.key === sort.key) : undefined;
    if (!sort || !col) return items;
    return sortItems(
      items,
      (it) => (it.row as AnyRow)[col.key],
      kindOf(col),
      sort.direction,
      locale,
    );
  }, [items, sort, columns, locale]);

  // ── selection (controlled when `selectedKeys` is passed) ──
  const [innerSelected, setInnerSelected] = useState<ReadonlySet<string>>(
    () => new Set(props.defaultSelectedKeys ?? []),
  );
  const selected: ReadonlySet<string> = props.selectedKeys
    ? new Set(props.selectedKeys)
    : innerSelected;
  const commit = (next: Set<string>) => {
    if (!props.selectedKeys) setInnerSelected(next);
    const chosen = sorted.filter((it) => next.has(it.key));
    props.onSelectionChange?.(
      chosen.map((it) => it.row),
      chosen.map((it) => it.key),
    );
  };
  const selection =
    selectionMode === "none"
      ? undefined
      : {
          mode: selectionMode,
          selected,
          toggle: (key: string) => commit(toggleSelection(selected, key, selectionMode)),
          toggleAll: () =>
            commit(
              toggleAll(
                selected,
                sorted.map((it) => it.key),
              ),
            ),
        };

  if (props.loading) {
    return (
      <div aria-busy="true" aria-label={t("TableView.loading", locale)} lang={locale}>
        {SKELETON_ROWS.map((_, i) => (
          <Skeleton
            key={SKELETON_ROWS[i]}
            variant="rect"
            height={i === 0 ? 24 : 36}
            locale={locale}
          />
        ))}
      </div>
    );
  }

  const content: TableContentProps<TRow> = {
    items: sorted,
    columns,
    ariaLabel,
    locale,
    onRowClick: props.onRowClick,
    sort,
    onSort,
    selection,
    sticky: stickyHeader,
    density,
  };

  const isVirtual = rows.length > props.virtualizeThreshold;
  if (isVirtual) return <VirtualTable<TRow> {...content} />;
  if (stickyHeader) {
    return (
      <div
        // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 — the sticky-header scroll region is scrollable and must be keyboard reachable (axe scrollable-region-focusable)
        tabIndex={0}
        // biome-ignore lint/a11y/useSemanticElements: the region wraps a <table>; role=region + aria-label is the non-structural annotation (same as the virtual viewport)
        role="region"
        aria-label={ariaLabel}
        style={{ maxHeight: props.maxHeight ?? 400, overflow: "auto" }}
      >
        <StaticTable<TRow> {...content} />
      </div>
    );
  }
  return <StaticTable<TRow> {...content} />;
}

// ── Shared pieces ─────────────────────────────────────────────────────────────

type SelectionApi = {
  mode: "single" | "multiple";
  selected: ReadonlySet<string>;
  toggle: (key: string) => void;
  toggleAll: () => void;
};

type TableContentProps<TRow extends AnyRow> = {
  items: Item<TRow>[];
  columns: CoreProps<TRow>["columns"];
  ariaLabel: string;
  locale: MosaicLocale;
  onRowClick?: (row: TRow, index: number) => void;
  sort: SortState | undefined;
  onSort: (key: string) => void;
  selection: SelectionApi | undefined;
  sticky: boolean;
  density: "comfortable" | "compact";
};

const CELL_PADDING = { comfortable: undefined, compact: "2px 6px" } as const;

function HeaderRow<TRow extends AnyRow>({
  columns,
  locale,
  sort,
  onSort,
  selection,
  sticky,
  density,
  items,
}: TableContentProps<TRow>) {
  const padding = CELL_PADDING[density];
  const stickyStyle = sticky
    ? { position: "sticky" as const, top: 0, background: "var(--mosaic-color-background, Canvas)" }
    : {};
  const allSelected = items.length > 0 && items.every((it) => selection?.selected.has(it.key));
  const someSelected = items.some((it) => selection?.selected.has(it.key));
  return (
    <tr>
      {selection ? (
        <th scope="col" style={{ ...stickyStyle, padding, width: 32 }}>
          {selection.mode === "multiple" ? (
            <input
              type="checkbox"
              aria-label={t("TableView.select.all", locale)}
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={selection.toggleAll}
            />
          ) : null}
        </th>
      ) : null}
      {columns.map((col) => {
        const dir = sort?.key === col.key ? sort.direction : undefined;
        return (
          <th
            key={col.key}
            scope="col"
            aria-sort={
              col.sortable
                ? dir === "asc"
                  ? "ascending"
                  : dir === "desc"
                    ? "descending"
                    : "none"
                : undefined
            }
            style={{
              ...stickyStyle,
              padding,
              textAlign: alignOf(col),
              ...(col.width !== undefined ? { width: col.width } : {}),
            }}
          >
            {col.sortable ? (
              <button
                type="button"
                aria-label={`${t("TableView.sort.by", locale)} ${col.header}`}
                onClick={() => onSort(col.key)}
                style={{ all: "inherit", cursor: "pointer", padding: 0 }}
              >
                {col.header}
                <span aria-hidden="true">{dir === "asc" ? " ▲" : dir === "desc" ? " ▼" : ""}</span>
              </button>
            ) : (
              col.header
            )}
          </th>
        );
      })}
    </tr>
  );
}

function SelectCell<TRow extends AnyRow>({
  item,
  columns,
  selection,
  locale,
  padding,
}: {
  item: Item<TRow>;
  columns: CoreProps<TRow>["columns"];
  selection: SelectionApi;
  locale: MosaicLocale;
  padding: string | undefined;
}) {
  const first = columns[0];
  const label = `${t("TableView.select.row", locale)}: ${first ? cellText(item.row as AnyRow, first.key) : item.key}`;
  return (
    <td
      style={{ padding, width: 32 }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <input
        type={selection.mode === "multiple" ? "checkbox" : "radio"}
        name={selection.mode === "single" ? "mosaic-table-selection" : undefined}
        aria-label={label}
        checked={selection.selected.has(item.key)}
        onChange={() => selection.toggle(item.key)}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </td>
  );
}

function rowActivation<TRow extends AnyRow>(
  onRowClick: TableContentProps<TRow>["onRowClick"],
  row: Partial<TRow>,
  index: number,
) {
  if (!onRowClick) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: () => onRowClick(row as TRow, index),
    onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRowClick(row as TRow, index);
      }
    },
  };
}

// ── Static table (rows <= virtualizeThreshold) ────────────────────────────────

function StaticTable<TRow extends AnyRow>(props: TableContentProps<TRow>) {
  const { items, columns, ariaLabel, locale, onRowClick, selection, density } = props;
  const emptyMsg = t("TableView.empty.message", locale);
  const padding = CELL_PADDING[density];
  const colSpan = columns.length + (selection ? 1 : 0);
  return (
    <table
      aria-label={ariaLabel}
      aria-rowcount={items.length}
      data-density={density}
      style={{ width: "100%", borderCollapse: "collapse" }}
    >
      <thead>
        <HeaderRow<TRow> {...props} />
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={colSpan} aria-label={emptyMsg}>
              {emptyMsg}
            </td>
          </tr>
        ) : (
          items.map((item, rowIndex) => (
            <tr
              key={item.key}
              aria-rowindex={rowIndex + 2}
              data-selected={selection?.selected.has(item.key) ? "true" : undefined}
              {...(onRowClick ? { style: { cursor: "pointer" } } : {})}
              {...rowActivation(onRowClick, item.row, rowIndex)}
            >
              {selection ? (
                <SelectCell<TRow>
                  item={item}
                  columns={columns}
                  selection={selection}
                  locale={locale}
                  padding={padding}
                />
              ) : null}
              {columns.map((col) => (
                <td key={col.key} style={{ padding, textAlign: alignOf(col) }}>
                  {renderCell(col, item.row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ── Virtual table (rows > virtualizeThreshold) — TanStack Virtual v3 ─────────

function VirtualTable<TRow extends AnyRow>(props: TableContentProps<TRow>) {
  const { items, columns, ariaLabel, locale, onRowClick, selection, density } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const padding = CELL_PADDING[density];

  const rowVirtualizer = useVirtualizer({
    count: items.length,
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
      // WCAG 2.1.1 / 2.1.3 (axe scrollable-region-focusable, serious): a
      // scrollable container must be keyboard-operable. tabIndex={0} puts the
      // virtualized viewport in the tab order so keyboard users can scroll it;
      // role=region + aria-label expose it as a named landmark so the focusable
      // element is announced. Verified axe 0 violations (tests/a11y/TableView.spec.ts).
      // biome-ignore lint/a11y/useSemanticElements: the scroll viewport wraps a <table>; converting it to <section> would nest sectioning content inside the table wrapper and break the virtualizer's ref-bound div — role=region is the correct, non-structural a11y annotation here
      role="region"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 — the virtual-scroll viewport is scrollable and must be in the tab order for keyboard scroll access (axe scrollable-region-focusable)
      tabIndex={0}
      aria-label={ariaLabel}
      style={{ height: 400, overflow: "auto", position: "relative" }}
    >
      <table
        aria-label={ariaLabel}
        aria-rowcount={items.length}
        data-density={density}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <HeaderRow<TRow> {...props} sticky />
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
            const item = items[virtualRow.index] ?? { row: {} as Partial<TRow>, key: "" };
            return (
              <tr
                key={item.key || `vrow-${virtualRow.index}`}
                aria-rowindex={virtualRow.index + 2}
                data-selected={selection?.selected.has(item.key) ? "true" : undefined}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "flex",
                  ...(onRowClick ? { cursor: "pointer" } : {}),
                }}
                {...rowActivation(onRowClick, item.row, virtualRow.index)}
              >
                {selection ? (
                  <SelectCell<TRow>
                    item={item}
                    columns={columns}
                    selection={selection}
                    locale={locale}
                    padding={padding}
                  />
                ) : null}
                {columns.map((col) => (
                  <td key={col.key} style={{ flex: 1, padding, textAlign: alignOf(col) }}>
                    {renderCell(col, item.row)}
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
