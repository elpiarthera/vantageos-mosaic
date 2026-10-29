import * as z from "zod";

// i18nKeys: ConfigDetail.choose, ConfigDetail.record, ConfigDetail.actions, ConfigDetail.empty.message, ConfigView.back, ConfigView.error.invalidConfig, ConfigView.error.invalidData

/**
 * Serialisable props of ConfigDetail. `config` is validated against `ViewConfigSchema`
 * (view-config/1) at render; see ConfigList.schema.ts.
 */
export const ConfigDetailPropsSchema = z.object({
  config: z.unknown(),
  payload: z.unknown(),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type ConfigDetailPropsInput = z.input<typeof ConfigDetailPropsSchema>;
