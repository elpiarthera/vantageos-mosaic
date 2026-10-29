import * as z from "zod";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { getPath } from "./path.js";

/** A label in both languages: every label of a view config carries `en` and `fr`. */
export const I18nTextSchema = z.strictObject({
  en: z.string().min(1),
  fr: z.string().min(1),
});
export type I18nText = z.output<typeof I18nTextSchema>;

/**
 * Serialisable cell / field format (the `format` of the view-config schema, section E). The set
 * of types is this enum: `formatValue` switches over it exhaustively, so a type added here and
 * not handled there is a compile error.
 */
export const COLUMN_FORMAT_TYPES = [
  "text",
  "date",
  "money",
  "percent",
  "number",
  "boolean",
  "enum",
  "count",
  "join",
] as const;

export const ColumnFormatSchema = z
  .strictObject({
    type: z.enum(COLUMN_FORMAT_TYPES),
    /** ISO 4217 code; required by `money` (the API carries no currency, so it is configuration). */
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    /** `enum`: raw value -> label in both languages. */
    map: z.record(z.string(), I18nTextSchema).optional(),
    /** `join`: path read on each element of the array. */
    joinPath: z.string().min(1).optional(),
    separator: z.string().optional(),
  })
  .superRefine((f, ctx) => {
    if (f.type === "money" && f.currency === undefined) {
      ctx.addIssue({ code: "custom", path: ["currency"], message: "money needs a currency" });
    }
    if (f.type === "enum" && f.map === undefined) {
      ctx.addIssue({ code: "custom", path: ["map"], message: "enum needs a map" });
    }
  });
export type ColumnFormat = z.output<typeof ColumnFormatSchema>;

const EMPTY = "—";
const NUMERIC = new Set<ColumnFormat["type"]>(["money", "number", "percent", "count"]);

/** Right-aligned, tabular figures. */
export function isNumericFormat(f: ColumnFormat | undefined): boolean {
  return f !== undefined && NUMERIC.has(f.type);
}

/** How a formatted column sorts: numbers by value, everything else as text. */
export function sortKindOfFormat(f: ColumnFormat | undefined): "number" | "text" | undefined {
  if (f === undefined) return undefined;
  return isNumericFormat(f) ? "number" : "text";
}

function rawText(v: unknown): string {
  return typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
}

function num(v: unknown): number | undefined {
  const n =
    typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : Number.NaN;
  return Number.isFinite(n) ? n : undefined;
}

function money(v: unknown, currency: string | undefined, locale: MosaicLocale): string {
  const n = num(v);
  if (n === undefined) return rawText(v);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

/**
 * Formats a value for display. Pure; the locale only selects wording and number / date
 * conventions. A value that does not fit its format is shown as its raw text, never hidden.
 * Missing values (`null`, `undefined`, empty string) show a dash.
 */
export function formatValue(
  value: unknown,
  format: ColumnFormat | undefined,
  locale: MosaicLocale,
): string {
  if (value === null || value === undefined || value === "") return EMPTY;
  if (format === undefined) return rawText(value);
  switch (format.type) {
    case "text":
      return rawText(value);
    case "date": {
      const d = new Date(value as string | number);
      return Number.isNaN(d.getTime())
        ? rawText(value)
        : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(d);
    }
    case "money":
      return money(value, format.currency, locale);
    case "percent": {
      const n = num(value);
      return n === undefined
        ? rawText(value)
        : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(
            n / 100,
          );
    }
    case "number":
    case "count": {
      // `count` also accepts a list and shows its length.
      const n = format.type === "count" && Array.isArray(value) ? value.length : num(value);
      return n === undefined ? rawText(value) : new Intl.NumberFormat(locale).format(n);
    }
    case "boolean":
      return typeof value === "boolean"
        ? t(value ? "ConfigView.boolean.true" : "ConfigView.boolean.false", locale)
        : rawText(value);
    case "enum": {
      const key = rawText(value);
      return format.map?.[key]?.[locale] ?? key;
    }
    case "join": {
      if (!Array.isArray(value)) return rawText(value);
      const parts = value
        .map((el) => (format.joinPath ? getPath(el, format.joinPath) : el))
        .filter((x) => x !== null && x !== undefined && x !== "")
        .map(rawText);
      return parts.join(format.separator ?? ", ");
    }
  }
}

/**
 * Text of one cell for a column `{ key, path?, format? }`: the dotted `path` (else the flat
 * `key`) read in the row, formatted when the column has a format, otherwise plain text. Shared by
 * the markdown twins so the A-1 fallback says what the view says.
 */
export function columnText(
  row: Record<string, unknown>,
  col: { key: string; path?: string; format?: ColumnFormat },
  locale: MosaicLocale,
): string {
  const v = col.path ? getPath(row, col.path) : row[col.key];
  return col.format ? formatValue(v, col.format, locale) : String(v ?? "");
}
