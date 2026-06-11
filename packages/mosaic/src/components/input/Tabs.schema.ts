import { z } from "zod";

// i18nKeys: Tabs.error.invalidProps

/**
 * Tabs component props schema.
 *
 * Supports controlled (value + onValueChange) and uncontrolled (defaultValue) modes.
 * orientation — "horizontal" (default) or "vertical" — affects ArrowLeft/Right vs ArrowUp/Down nav.
 * tabs — ordered list of tab descriptors (id must be unique within the instance).
 */
export const TabItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** ReactNode / PreactNode — accepted as unknown at Zod layer (JSX not serialisable). */
  content: z.unknown(),
  disabled: z.boolean().optional().default(false),
});

export type TabItem = z.infer<typeof TabItemSchema>;

export const TabsPropsSchema = z.object({
  tabs: z.array(TabItemSchema).min(1),
  value: z.string().optional(),
  defaultValue: z.string().optional(),
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  locale: z.enum(["en", "fr"]).default("en"),
});

/** Runtime props — onValueChange is a function (not serialisable via Zod, kept outside schema). */
export type TabsProps = z.infer<typeof TabsPropsSchema> & {
  onValueChange?: (id: string) => void;
};

export function validateTabsProps(raw: unknown): z.infer<typeof TabsPropsSchema> {
  return TabsPropsSchema.parse(raw);
}
