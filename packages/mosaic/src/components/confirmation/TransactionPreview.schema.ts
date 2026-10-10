import { z } from "zod";

// i18nKeys: TransactionPreview.title, TransactionPreview.notice, TransactionPreview.kind.transfer, TransactionPreview.kind.swap, TransactionPreview.testnet, TransactionPreview.field.network, TransactionPreview.field.from, TransactionPreview.field.to, TransactionPreview.field.amount, TransactionPreview.field.fee, TransactionPreview.field.sell, TransactionPreview.field.buy, TransactionPreview.field.minReceived, TransactionPreview.field.route, TransactionPreview.field.priceImpact, TransactionPreview.field.expires, TransactionPreview.priceImpact.high, TransactionPreview.simulation.success, TransactionPreview.simulation.failed, TransactionPreview.simulation.unavailable, TransactionPreview.warnings, TransactionPreview.handoff, TransactionPreview.empty.message, TransactionPreview.loading, TransactionPreview.error.invalidProps

const AmountSchema = z.object({
  /** Decimal STRING (never a float). */
  value: z.string().min(1),
  symbol: z.string().min(1),
});

const QuoteSchema = z.object({
  sell: AmountSchema,
  buy: AmountSchema,
  minReceived: AmountSchema.optional(),
  route: z.array(z.string().min(1)).optional(),
  /** Percent as a decimal string, e.g. "0.42". */
  priceImpact: z.string().optional(),
});

export type TransactionAmount = z.infer<typeof AmountSchema>;
export type TransactionQuote = z.infer<typeof QuoteSchema>;

/**
 * TransactionPreview (R11): a transaction the server PREPARED and never signs — shape follows
 * fuse-mcp-server `getTradeQuote.ts` (expected output, route, price impact; read-only). There
 * is deliberately no field for a signature, a signer, a raw transaction or an execute action
 * (R12 refused): the only exit is an optional `handoff` link to the user's wallet. OpenAI's
 * public directory prohibits executing crypto transfers, so the view stops at the preview.
 * `{}` parses (empty state).
 */
export const TransactionPreviewPropsSchema = z.object({
  kind: z.enum(["transfer", "swap"]).default("transfer"),
  network: z.string().optional(),
  testnet: z.boolean().default(false),
  from: z.string().optional(),
  to: z.string().optional(),
  amount: AmountSchema.optional(),
  fee: AmountSchema.optional(),
  quote: QuoteSchema.optional(),
  simulation: z
    .object({
      status: z.enum(["success", "failed", "unavailable"]),
      message: z.string().optional(),
    })
    .optional(),
  warnings: z.array(z.string()).default([]),
  /** ISO 8601 expiry of the quote. */
  expiresAt: z.string().optional(),
  /** Wallet link-out. Only http(s) urls are ever rendered. */
  handoff: z.object({ url: z.string().min(1) }).optional(),
  timeZone: z.string().optional(),
  loading: z.boolean().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type TransactionPreviewProps = z.input<typeof TransactionPreviewPropsSchema>;
export type TransactionPreviewPropsOutput = z.output<typeof TransactionPreviewPropsSchema>;

export function validateTransactionPreviewProps(raw: unknown): TransactionPreviewPropsOutput {
  return TransactionPreviewPropsSchema.parse(raw);
}

/** True when the transaction has anything to preview. */
export function hasPreviewContent(p: TransactionPreviewPropsOutput): boolean {
  return Boolean(p.from || p.to || p.amount || p.quote || p.fee);
}
