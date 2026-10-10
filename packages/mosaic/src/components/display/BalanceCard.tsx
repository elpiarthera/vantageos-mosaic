// i18nKeys: BalanceCard.title, BalanceCard.network, BalanceCard.testnet, BalanceCard.address, BalanceCard.contract, BalanceCard.value, BalanceCard.copy, BalanceCard.copied, BalanceCard.empty.message, BalanceCard.loading, BalanceCard.error.invalidProps

import React, { useState } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { Badge } from "../../runtimes/react/components/display/Badge.js";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import { formatDecimalString, truncateAddress } from "../shared/decimal.js";
import { type BalanceCardProps, BalanceCardPropsSchema } from "./BalanceCard.schema.js";
import { StatCard } from "./StatCard.js";

/**
 * BalanceCard — composition of {@link StatCard} (amount + token) with the network badge, a
 * testnet badge, the truncated address (full address in `title`) and, when the sandbox exposes
 * the async clipboard, a copy button. Read-only; no wallet action.
 */
export function BalanceCard(raw: BalanceCardProps) {
  const parsed = BalanceCardPropsSchema.safeParse(raw);
  const locale: MosaicLocale =
    (raw as { locale?: string } | undefined)?.locale === "fr" ? "fr" : "en";
  const [copied, setCopied] = useState(false);
  if (!parsed.success) {
    return <div role="alert">{t("BalanceCard.error.invalidProps", locale)}</div>;
  }
  const p = parsed.data;
  if (p.loading) {
    return (
      <div aria-busy="true" aria-label={t("BalanceCard.loading", p.locale)}>
        <Skeleton variant="rect" height={120} locale={p.locale} />
      </div>
    );
  }
  if (p.token === "" && p.balance === "") {
    return <EmptyState title={t("BalanceCard.empty.message", p.locale)} locale={p.locale} />;
  }
  const canCopy =
    typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.address);
      setCopied(true);
    } catch {
      // clipboard-write may be denied by the host sandbox: the address stays selectable
    }
  };
  return (
    <section
      aria-label={`${t("BalanceCard.title", p.locale)}: ${p.token}`}
      lang={p.locale}
      className="flex flex-col gap-2"
    >
      <StatCard
        label={t("BalanceCard.title", p.locale)}
        value={p.balance}
        unit={p.token}
        locale={p.locale}
      />
      <div className="flex flex-wrap items-center gap-2">
        {p.network ? <Badge label={p.network} variant="info" locale={p.locale} /> : null}
        {p.testnet ? (
          <Badge label={t("BalanceCard.testnet", p.locale)} variant="warning" locale={p.locale} />
        ) : null}
      </div>
      {p.usdValue ? (
        <span className="text-sm text-slate-600">
          {t("BalanceCard.value", p.locale)}:{" "}
          {formatDecimalString(p.usdValue, p.locale, p.currency)}
        </span>
      ) : null}
      {p.address ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-mono" title={p.address}>
            {truncateAddress(p.address)}
          </span>
          {canCopy ? (
            <button
              type="button"
              onClick={copy}
              className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
            >
              {t("BalanceCard.copy", p.locale)}
            </button>
          ) : null}
          {copied ? <output>{t("BalanceCard.copied", p.locale)}</output> : null}
        </div>
      ) : null}
    </section>
  );
}
