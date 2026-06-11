import { z } from "zod";

// i18nKeys: Alert.aria.dismiss, Alert.error.invalidProps

/**
 * Alert component props schema.
 *
 * Persistent inline banner (vs Toast which is ephemeral + auto-dismissing).
 *
 * variant      — controls visual style + ARIA role auto-assignment:
 *                "error" → role="alert"  (assertive, interrupts screen reader)
 *                all others → role="status" (polite, non-intrusive)
 * title        — consumer-driven; caller passes already-localized string
 * description  — optional supporting text beneath the title
 * dismissible  — when true, renders a dismiss button (default: false)
 * onDismiss    — callback fired when dismiss button is clicked
 * locale       — controls dismiss button aria-label language
 */
export const AlertPropsSchema = z.object({
  variant: z.enum(["success", "error", "info", "warning"]),
  title: z.string().min(1),
  description: z.string().optional(),
  dismissible: z.boolean().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type AlertProps = z.infer<typeof AlertPropsSchema> & {
  onDismiss?: () => void;
};

export function validateAlertProps(raw: unknown): z.infer<typeof AlertPropsSchema> {
  return AlertPropsSchema.parse(raw);
}
