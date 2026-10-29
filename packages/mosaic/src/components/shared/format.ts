import * as z from "zod";
import type { MosaicLocale } from "../../i18n/strings.js";

export const I18nTextSchema = z.unknown();
export const ColumnFormatSchema = z.unknown();
export type ColumnFormat = {
  type: string;
  currency?: string;
  map?: Record<string, { en: string; fr: string }>;
  joinPath?: string;
  separator?: string;
};

export function formatValue(_v: unknown, _f: ColumnFormat | undefined, _l: MosaicLocale): string {
  throw new Error("not implemented");
}
export function sortKindOfFormat(_f: ColumnFormat | undefined): "number" | "text" | undefined {
  throw new Error("not implemented");
}
export function isNumericFormat(_f: ColumnFormat | undefined): boolean {
  throw new Error("not implemented");
}
