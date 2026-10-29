import * as z from "zod";

// i18nKeys: ConfigList.paging.more, ConfigList.paging.loading, ConfigList.truncated, ConfigList.actions.header, ConfigList.empty.message, ConfigList.totals.incomplete, ConfigList.totals.scope, ConfigView.error.invalidConfig, ConfigView.error.invalidData

/**
 * Serialisable props of ConfigList. `config` is deliberately `unknown` here: it is validated
 * against `ViewConfigSchema` (view-config/1) at render, so an invalid config renders a visible
 * refusal that names the problem instead of failing the props parse into a generic error.
 */
export const ConfigListPropsSchema = z.object({
  config: z.unknown(),
  payload: z.unknown(),
  locale: z.enum(["en", "fr"]).default("en"),
  toolArgs: z.record(z.string(), z.unknown()).optional(),
});

export type ConfigListPropsInput = z.input<typeof ConfigListPropsSchema>;

/** Unknown or missing locale reads as `en` (a refusal must still be readable). */
export const resolveConfigLocale = (raw: unknown): "en" | "fr" =>
  ConfigListPropsSchema.shape.locale.catch("en").parse(raw);
