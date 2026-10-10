import type { ReactNode } from "react";
import type { Observable } from "rxjs";
import { z } from "zod";
import type { SelectionMode, SortState } from "./TableView.logic";

// i18nKeys: TableView.aria.table, TableView.pagination.next, TableView.pagination.prev, TableView.empty.message, TableView.error.invalidProps, TableView.sort.by, TableView.select.row, TableView.select.all, TableView.loading

const ColumnKindSchema = z.enum(["text", "number", "amount", "icon"]);
const AlignSchema = z.enum(["start", "center", "end"]);

export const ColumnDefSchema = z.object({
  key: z.string().min(1),
  header: z.string().min(1),
  /** Cell kind: drives comparison and rendering. `amount` = decimal STRING, never a float. */
  type: ColumnKindSchema.default("text"),
  /** Defaults to `end` for `number` / `amount` columns, `start` otherwise. */
  align: AlignSchema.optional(),
  /** CSS width: a number is pixels. */
  width: z.union([z.string().min(1), z.number().positive()]).optional(),
  sortable: z.boolean().default(false),
  /**
   * Values of this column are masked in the A-1 markdown fallback and kept out of the HTML
   * props of a tool result (delivered via the result `_meta`), never written to `content[]`.
   */
  sensitive: z.boolean().default(false),
  // render is a runtime function — excluded from Zod, typed separately
});

export type ColumnDef<TRow extends Record<string, unknown> = Record<string, unknown>> = {
  key: string;
  header: string;
  type?: "text" | "number" | "amount" | "icon";
  align?: "start" | "center" | "end";
  width?: string | number;
  sortable?: boolean;
  sensitive?: boolean;
  render?: (row: TRow) => ReactNode;
};

const SortSchema = z.object({ key: z.string().min(1), direction: z.enum(["asc", "desc"]) });

/**
 * Validates the serialisable (non-function) portion of TableView props.
 * The `rows$` Observable and `render` callbacks are not Zod-parseable and
 * must be validated at the call-site type level.
 */
export const TableViewPropsSchema = z.object({
  columns: z.array(ColumnDefSchema).min(1, "TableView requires at least one column"),
  /**
   * Serialisable rows, for views built through `createMosaicResource` (the React props carry
   * `rows` separately).
   */
  rows: z.array(z.record(z.unknown())).default([]),
  virtualizeThreshold: z.number().int().positive().default(100),
  ariaLabel: z.string().min(1),
  locale: z.enum(["en", "fr"]).default("en"),
  selectionMode: z.enum(["none", "single", "multiple"]).default("none"),
  /** Initial sort. */
  sort: SortSchema.optional(),
  stickyHeader: z.boolean().default(false),
  /** Scroll region height when `stickyHeader` is on (pixels). */
  maxHeight: z.number().int().positive().default(400),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  loading: z.boolean().default(false),
});

export type TableViewPropsSchemaInput = z.input<typeof TableViewPropsSchema>;
export type TableViewPropsSchemaOutput = z.output<typeof TableViewPropsSchema>;

/** Options shared by the static and streaming variants (R01 / R10 extension). */
export type TableViewOptions<TRow extends Record<string, unknown>> = {
  /** `none` (default) adds no selection column. `single` renders radios, `multiple` checkboxes. */
  selectionMode?: SelectionMode;
  /** Controlled selection: row keys (`id` when present, else `row-<original index>`). */
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  /** Selected rows in table order, plus their keys. Feed it to `selectionModelContext`. */
  onSelectionChange?: (rows: Partial<TRow>[], keys: string[]) => void;
  /** Controlled sort; `null` = unsorted. */
  sort?: SortState | null;
  defaultSort?: SortState;
  onSortChange?: (sort: SortState | undefined) => void;
  stickyHeader?: boolean;
  /** Scroll region height in pixels when `stickyHeader` is on. Default 400. */
  maxHeight?: number;
  density?: "comfortable" | "compact";
  /** Shows a Skeleton table instead of rows. */
  loading?: boolean;
};

/**
 * Props for the static TableView — accepts a plain array of rows.
 * Primary API for already-fetched data (no rxjs required).
 */
export type TableViewProps<TRow extends Record<string, unknown> = Record<string, unknown>> = {
  columns: ColumnDef<TRow>[];
  rows: Partial<TRow>[];
  virtualizeThreshold?: number;
  ariaLabel: string;
  locale?: "en" | "fr";
  /** v0.2.1+: when provided, rows become keyboard-activable (role=button + tabIndex=0 + Enter/Space). 5-BU ABSOLUTE blocker fix. */
  onRowClick?: (row: TRow, index: number) => void;
} & TableViewOptions<TRow>;

/**
 * Props for StreamingTableView — accepts an RxJS Observable for incremental row appending.
 * Consumers using this variant MUST install rxjs ^7.8.0 in their project.
 */
export type StreamingTableViewProps<
  TRow extends Record<string, unknown> = Record<string, unknown>,
> = {
  columns: ColumnDef<TRow>[];
  rows$: Observable<Partial<TRow>[]>;
  virtualizeThreshold?: number;
  ariaLabel: string;
  locale?: "en" | "fr";
  /** v0.2.1+: same semantics as static TableView. */
  onRowClick?: (row: TRow, index: number) => void;
} & TableViewOptions<TRow>;

export function validateTableViewProps(raw: unknown): TableViewPropsSchemaOutput {
  return TableViewPropsSchema.parse(raw);
}
