import { z } from "zod";

// i18nKeys: TransactionPreview.title, TransactionPreview.notice, TransactionPreview.kind.transfer, TransactionPreview.kind.swap, TransactionPreview.testnet, TransactionPreview.field.network, TransactionPreview.field.from, TransactionPreview.field.to, TransactionPreview.field.amount, TransactionPreview.field.fee, TransactionPreview.field.sell, TransactionPreview.field.buy, TransactionPreview.field.minReceived, TransactionPreview.field.route, TransactionPreview.field.priceImpact, TransactionPreview.field.expires, TransactionPreview.priceImpact.high, TransactionPreview.simulation.success, TransactionPreview.simulation.failed, TransactionPreview.simulation.unavailable, TransactionPreview.warnings, TransactionPreview.handoff, TransactionPreview.empty.message, TransactionPreview.loading, TransactionPreview.error.invalidProps
// RED stub schema.
export const TransactionPreviewPropsSchema = z.object({}).passthrough();
export type TransactionPreviewProps = Record<string, unknown>;
export type TransactionPreviewPropsOutput = Record<string, unknown>;
export function validateTransactionPreviewProps(raw: unknown): TransactionPreviewPropsOutput {
  return TransactionPreviewPropsSchema.parse(raw);
}
