import type { ReactNode } from "react";
import type { Observable } from "rxjs";
import { z } from "zod";

// i18nKeys: TableView.aria.table, TableView.pagination.next, TableView.pagination.prev, TableView.empty.message, TableView.error.invalidProps

export const ColumnDefSchema = z.object({
  key: z.string().min(1),
  header: z.string().min(1),
  // render is a runtime function — excluded from Zod, typed separately
});

export type ColumnDef<TRow extends Record<string, unknown> = Record<string, unknown>> = {
  key: string;
  header: string;
  render?: (row: TRow) => ReactNode;
};

/**
 * Validates the serialisable (non-function) portion of TableView props.
 * The `rows$` Observable and `render` callbacks are not Zod-parseable and
 * must be validated at the call-site type level.
 */
export const TableViewSchema = z.object({
  columns: z.array(ColumnDefSchema).min(1, "TableView requires at least one column"),
  virtualizeThreshold: z.number().int().positive().default(100),
  ariaLabel: z.string().min(1),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type TableViewSchemaInput = z.input<typeof TableViewSchema>;
export type TableViewSchemaOutput = z.output<typeof TableViewSchema>;

/** Full runtime props — rows$ is typed but not Zod-parseable. */
export type TableViewProps<TRow extends Record<string, unknown> = Record<string, unknown>> = {
  columns: ColumnDef<TRow>[];
  rows$: Observable<Partial<TRow>[]>;
  virtualizeThreshold?: number;
  ariaLabel: string;
  locale?: "en" | "fr";
};

export function validateTableViewProps(raw: unknown): TableViewSchemaOutput {
  return TableViewSchema.parse(raw);
}
