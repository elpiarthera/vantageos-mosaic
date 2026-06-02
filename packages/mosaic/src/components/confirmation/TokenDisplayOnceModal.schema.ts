import { z } from "zod";

// i18nKeys: TokenDisplayOnceModal.button.copy, TokenDisplayOnceModal.button.close,
//           TokenDisplayOnceModal.warning.once, TokenDisplayOnceModal.copied

export const TokenDisplayOnceModalSchema = z.object({
  token: z.string().min(1),
  title: z.string().min(1),
  warningMessage: z.string().min(1),
  copyLabel: z.string().min(1),
  closeLabel: z.string().min(1),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type TokenDisplayOnceModalProps = z.infer<typeof TokenDisplayOnceModalSchema> & {
  onClose: () => void;
};

export function validateTokenDisplayOnceModalProps(
  raw: unknown,
): z.infer<typeof TokenDisplayOnceModalSchema> {
  return TokenDisplayOnceModalSchema.parse(raw);
}
