import { z } from "zod";

// i18nKeys: EmptyState.error.invalidProps

/**
 * EmptyState component props schema.
 *
 * Empty-set illustration + title + description + optional CTA.
 * Consumer-driven i18n: caller passes already-localized strings.
 *
 * icon        — optional ReactNode / PreactNode passed by the caller
 * title       — required heading (h2, consumer-driven i18n)
 * description — optional supporting text
 * action      — optional CTA: { label, onClick, variant? }
 */
export const EmptyStatePropsSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  action: z
    .object({
      label: z.string().min(1),
      variant: z.enum(["primary", "secondary"]).default("primary"),
    })
    .optional(),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type EmptyStatePropsSchemaInput = z.input<typeof EmptyStatePropsSchema>;
export type EmptyStatePropsSchemaOutput = z.output<typeof EmptyStatePropsSchema>;

/**
 * Full EmptyState props including framework-specific node types and callback.
 * `icon` and `action.onClick` are excluded from Zod (functions/nodes are not serializable).
 *
 * Note: action.variant is optional for callers — Zod applies "primary" default at parse time.
 */
export type EmptyStateProps = Omit<EmptyStatePropsSchemaOutput, "action"> & {
  // biome-ignore lint/suspicious/noExplicitAny: cross-runtime ReactNode | VNode
  icon?: any;
  action?: {
    label: string;
    variant?: "primary" | "secondary";
    onClick: () => void;
  };
};

export function validateEmptyStateProps(raw: unknown): EmptyStatePropsSchemaOutput {
  return EmptyStatePropsSchema.parse(raw);
}
