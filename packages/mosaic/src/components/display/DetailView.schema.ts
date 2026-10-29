import * as z from "zod";
export const DetailViewPropsSchema = z.unknown();
export type DetailViewProps = Record<string, unknown>;
export function validateDetailViewProps(raw: unknown) {
  return raw;
}
