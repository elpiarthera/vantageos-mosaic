import { z } from "zod";

// i18nKeys: BalanceCard.title, BalanceCard.network, BalanceCard.testnet, BalanceCard.address, BalanceCard.contract, BalanceCard.value, BalanceCard.copy, BalanceCard.copied, BalanceCard.empty.message, BalanceCard.loading, BalanceCard.error.invalidProps

/**
 * BalanceCard (R09): a wallet balance for the Fuse server views.
 *
 * Source shape: fuse-mcp-server `src/tools/getBalance.ts` returns `{ address, token,
 * tokenAddress?, decimals, balanceRaw?, balanceWei?, balanceFormatted }`. `balance` is the
 * `balanceFormatted` DECIMAL STRING — shown as given, never routed through a float. Read-only.
 * `{}` parses (ChatGPT entrypoint default).
 */
export const BalanceCardPropsSchema = z.object({
  token: z.string().default(""),
  balance: z.string().default(""),
  address: z.string().default(""),
  tokenAddress: z.string().optional(),
  decimals: z.number().int().nonnegative().optional(),
  network: z.string().optional(),
  testnet: z.boolean().default(false),
  /** Decimal string in `currency`. */
  usdValue: z.string().optional(),
  currency: z.string().default("USD"),
  loading: z.boolean().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type BalanceCardProps = z.input<typeof BalanceCardPropsSchema>;
export type BalanceCardPropsOutput = z.output<typeof BalanceCardPropsSchema>;

export function validateBalanceCardProps(raw: unknown): BalanceCardPropsOutput {
  return BalanceCardPropsSchema.parse(raw);
}
