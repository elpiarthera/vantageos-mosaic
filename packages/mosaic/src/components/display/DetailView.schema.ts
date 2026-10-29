import * as z from "zod";
import { ColumnFormatSchema } from "../shared/format";
import { ColumnDefSchema } from "./TableView.schema";

// i18nKeys: DetailView.title, DetailView.empty.message, DetailView.loading, DetailView.error.invalidProps

const FieldSchema = z.object({
  label: z.string().min(1),
  /** Raw value; the `format` decides how it is shown. Absent / null shows a dash. */
  value: z.unknown().optional(),
  format: ColumnFormatSchema.optional(),
});

const TableSchema = z.object({
  columns: z.array(ColumnDefSchema).min(1),
  rows: z.array(z.record(z.string(), z.unknown())).default([]),
});

const SectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  fields: z.array(FieldSchema).default([]),
  /** A nested table (a TableView), named after the section. */
  table: TableSchema.optional(),
});

/**
 * DetailView (G1): one record as a description list with sections, labelled fields and nested
 * tables. Every field has a default so `{}` parses and the view shows an empty state.
 */
export const DetailViewPropsSchema = z.object({
  title: z.string().default(""),
  sections: z.array(SectionSchema).default([]),
  locale: z.enum(["en", "fr"]).default("en"),
  loading: z.boolean().default(false),
});

export type DetailViewProps = z.input<typeof DetailViewPropsSchema>;
export type DetailViewPropsOutput = z.output<typeof DetailViewPropsSchema>;

export function validateDetailViewProps(raw: unknown): DetailViewPropsOutput {
  return DetailViewPropsSchema.parse(raw);
}
