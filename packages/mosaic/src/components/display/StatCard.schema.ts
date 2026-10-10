import { z } from "zod";

// i18nKeys: StatCard.title, StatCard.trend.up, StatCard.trend.down, StatCard.trend.flat, StatCard.empty.message, StatCard.loading, StatCard.error.invalidProps

/**
 * StatCard (R08): one metric — label, value, optional trend and change.
 *
 * Every field has a default so `{}` parses: a ChatGPT global entrypoint opens with empty
 * arguments (openai/mcp-extensions docs/spec.md, entrypoints) and the view then shows an empty
 * state instead of failing. `value` is a STRING (a decimal string for money, never a float).
 * Claude inline cards count each stat toward the "4-5 data points" cap: keep few per card.
 */
export const StatCardPropsSchema = z.object({
  label: z.string().default(""),
  value: z.string().default(""),
  unit: z.string().optional(),
  trend: z.enum(["up", "down", "flat"]).optional(),
  /** Pre-formatted change, e.g. "+4.2%". */
  change: z.string().optional(),
  tone: z.enum(["neutral", "success", "warning", "danger"]).default("neutral"),
  description: z.string().optional(),
  loading: z.boolean().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type StatCardProps = z.input<typeof StatCardPropsSchema>;
export type StatCardPropsOutput = z.output<typeof StatCardPropsSchema>;

export function validateStatCardProps(raw: unknown): StatCardPropsOutput {
  return StatCardPropsSchema.parse(raw);
}
