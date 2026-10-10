import { z } from "zod";

// i18nKeys: StatCard.title, StatCard.trend.up, StatCard.trend.down, StatCard.trend.flat, StatCard.empty.message, StatCard.loading, StatCard.error.invalidProps
// RED stub schema: the real one lands with the implementation.
export const StatCardPropsSchema = z.object({}).passthrough();
export type StatCardProps = Record<string, unknown>;
export function validateStatCardProps(raw: unknown): StatCardProps {
  return StatCardPropsSchema.parse(raw);
}
