import { z } from "zod";

// i18nKeys: ConfirmDialog.button.confirm, ConfirmDialog.button.cancel, ConfirmDialog.aria.dialog

export const ConfirmDialogSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  confirmLabel: z.string().min(1),
  cancelLabel: z.string().min(1),
  variant: z.enum(["default", "danger"]).default("default"),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type ConfirmDialogProps = z.infer<typeof ConfirmDialogSchema> & {
  onConfirm: () => void;
  onCancel: () => void;
};

export function validateConfirmDialogProps(raw: unknown): z.infer<typeof ConfirmDialogSchema> {
  return ConfirmDialogSchema.parse(raw);
}
