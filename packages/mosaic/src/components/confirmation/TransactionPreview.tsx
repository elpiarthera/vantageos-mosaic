// i18nKeys: TransactionPreview.title, TransactionPreview.notice, TransactionPreview.kind.transfer, TransactionPreview.kind.swap, TransactionPreview.testnet, TransactionPreview.field.network, TransactionPreview.field.from, TransactionPreview.field.to, TransactionPreview.field.amount, TransactionPreview.field.fee, TransactionPreview.field.sell, TransactionPreview.field.buy, TransactionPreview.field.minReceived, TransactionPreview.field.route, TransactionPreview.field.priceImpact, TransactionPreview.field.expires, TransactionPreview.priceImpact.high, TransactionPreview.simulation.success, TransactionPreview.simulation.failed, TransactionPreview.simulation.unavailable, TransactionPreview.warnings, TransactionPreview.handoff, TransactionPreview.empty.message, TransactionPreview.loading, TransactionPreview.error.invalidProps

import type React from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { Badge } from "../../runtimes/react/components/display/Badge.js";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import { compareDecimalStrings } from "../display/TableView.logic.js";
import { formatTimestamp } from "../shared/datetime.js";
import { normalizeHttpUrl } from "../shared/url.js";
import {
  type TransactionAmount,
  type TransactionPreviewProps,
  TransactionPreviewPropsSchema,
  hasPreviewContent,
} from "./TransactionPreview.schema.js";

export type TransactionPreviewViewProps = TransactionPreviewProps & {
  /** Hand the user to their wallet (host `ui/open-link`, see `openLink` in ./host). */
  onHandoff?: (url: string) => void;
};

const amountText = (a: TransactionAmount) => `${a.value} ${a.symbol}`;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1 sm:flex-row sm:gap-3">
      <dt className="w-36 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="m-0 min-w-0 break-all text-sm text-slate-900">{children}</dd>
    </div>
  );
}

/**
 * TransactionPreview — a PREPARED transaction, never signed. Full addresses are shown (a user
 * verifies the whole address). The view has no sign, send, approve or confirm control — the only
 * action is an optional hand-off to the user's wallet, at most one (Claude allows two actions).
 */
export function TransactionPreview(raw: TransactionPreviewViewProps = {}) {
  const parsed = TransactionPreviewPropsSchema.safeParse(raw);
  const locale: MosaicLocale =
    (raw as { locale?: string } | undefined)?.locale === "fr" ? "fr" : "en";
  if (!parsed.success) {
    return <div role="alert">{t("TransactionPreview.error.invalidProps", locale)}</div>;
  }
  const p = parsed.data;
  if (p.loading) {
    return (
      <div aria-busy="true" aria-label={t("TransactionPreview.loading", p.locale)}>
        <Skeleton variant="text" count={6} locale={p.locale} />
      </div>
    );
  }
  if (!hasPreviewContent(p)) {
    return <EmptyState title={t("TransactionPreview.empty.message", p.locale)} locale={p.locale} />;
  }
  const highImpact =
    p.quote?.priceImpact !== undefined && compareDecimalStrings(p.quote.priceImpact, "1") >= 0;
  const handoff = normalizeHttpUrl(p.handoff?.url);
  return (
    <section
      aria-label={t("TransactionPreview.title", p.locale)}
      lang={p.locale}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <header className="flex flex-wrap items-center gap-2">
        <strong className="text-slate-900">
          {t(`TransactionPreview.kind.${p.kind}`, p.locale)}
        </strong>
        {p.testnet ? (
          <Badge
            label={t("TransactionPreview.testnet", p.locale)}
            variant="warning"
            locale={p.locale}
          />
        ) : null}
      </header>
      <p
        role="note"
        className="m-0 rounded bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
      >
        {t("TransactionPreview.notice", p.locale)}
      </p>
      <dl className="m-0">
        {p.network ? (
          <Row label={t("TransactionPreview.field.network", p.locale)}>{p.network}</Row>
        ) : null}
        {p.from ? (
          <Row label={t("TransactionPreview.field.from", p.locale)}>
            <span className="font-mono">{p.from}</span>
          </Row>
        ) : null}
        {p.to ? (
          <Row label={t("TransactionPreview.field.to", p.locale)}>
            <span className="font-mono">{p.to}</span>
          </Row>
        ) : null}
        {p.amount ? (
          <Row label={t("TransactionPreview.field.amount", p.locale)}>{amountText(p.amount)}</Row>
        ) : null}
        {p.quote ? (
          <>
            <Row label={t("TransactionPreview.field.sell", p.locale)}>
              {amountText(p.quote.sell)}
            </Row>
            <Row label={t("TransactionPreview.field.buy", p.locale)}>{amountText(p.quote.buy)}</Row>
            {p.quote.minReceived ? (
              <Row label={t("TransactionPreview.field.minReceived", p.locale)}>
                {amountText(p.quote.minReceived)}
              </Row>
            ) : null}
            {p.quote.route ? (
              <Row label={t("TransactionPreview.field.route", p.locale)}>
                {p.quote.route.join(" > ")}
              </Row>
            ) : null}
            {p.quote.priceImpact !== undefined ? (
              <Row label={t("TransactionPreview.field.priceImpact", p.locale)}>
                <span>{`${p.quote.priceImpact}%`}</span>
                {highImpact ? (
                  <strong className="ml-2 text-red-700">
                    {t("TransactionPreview.priceImpact.high", p.locale)}
                  </strong>
                ) : null}
              </Row>
            ) : null}
          </>
        ) : null}
        {p.fee ? (
          <Row label={t("TransactionPreview.field.fee", p.locale)}>{amountText(p.fee)}</Row>
        ) : null}
        {p.expiresAt ? (
          <Row label={t("TransactionPreview.field.expires", p.locale)}>
            {formatTimestamp(p.expiresAt, p.locale, p.timeZone)}
          </Row>
        ) : null}
      </dl>
      {p.simulation ? (
        <div className="text-sm">
          <strong className={p.simulation.status === "failed" ? "text-red-700" : "text-slate-800"}>
            {t(`TransactionPreview.simulation.${p.simulation.status}`, p.locale)}
          </strong>
          {p.simulation.message ? (
            <span className="block text-slate-600">{p.simulation.message}</span>
          ) : null}
        </div>
      ) : null}
      {p.warnings.length > 0 ? (
        <div className="text-sm">
          <strong className="text-amber-800">{t("TransactionPreview.warnings", p.locale)}</strong>
          <ul className="m-0 pl-5">
            {p.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {handoff ? (
        raw.onHandoff ? (
          <button
            type="button"
            onClick={() => raw.onHandoff?.(handoff)}
            className="self-start rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            {t("TransactionPreview.handoff", p.locale)}
          </button>
        ) : (
          <a
            href={handoff}
            rel="noopener noreferrer"
            target="_blank"
            className="self-start text-sm text-blue-700 underline"
          >
            {t("TransactionPreview.handoff", p.locale)}
          </a>
        )
      ) : null}
    </section>
  );
}
