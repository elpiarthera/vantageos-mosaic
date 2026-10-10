import { z } from "zod";

// i18nKeys: BalanceCard.title, BalanceCard.network, BalanceCard.testnet, BalanceCard.address, BalanceCard.contract, BalanceCard.value, BalanceCard.copy, BalanceCard.copied, BalanceCard.empty.message, BalanceCard.loading, BalanceCard.error.invalidProps
// RED stub schema.
export const BalanceCardPropsSchema = z.object({}).passthrough();
export type BalanceCardProps = Record<string, unknown>;
export function validateBalanceCardProps(raw: unknown): BalanceCardProps {
  return BalanceCardPropsSchema.parse(raw);
}
