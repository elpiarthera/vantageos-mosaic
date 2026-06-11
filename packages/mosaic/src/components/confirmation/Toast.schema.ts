import { z } from "zod";

// i18nKeys: Toast.aria.close, Toast.error.invalidProps

/**
 * Toast component props schema.
 *
 * variant   — controls visual style + ARIA role:
 *             "error" → role="alert" (assertive), all others → role="status" (polite)
 * title     — consumer-driven; caller passes already-localized string (no i18n key needed)
 * duration  — 0 = persistent (never auto-dismiss)
 */
export const ToastPropsSchema = z.object({
  variant: z.enum(["success", "error", "info", "warning"]),
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().nonnegative().default(5000),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type ToastProps = z.infer<typeof ToastPropsSchema> & {
  onClose?: () => void;
};

export function validateToastProps(raw: unknown): z.infer<typeof ToastPropsSchema> {
  return ToastPropsSchema.parse(raw);
}
