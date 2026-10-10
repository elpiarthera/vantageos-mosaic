// i18nKeys: StatCard.title, StatCard.trend.up, StatCard.trend.down, StatCard.trend.flat, StatCard.empty.message, StatCard.loading, StatCard.error.invalidProps

import React from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import { type StatCardProps, StatCardPropsSchema } from "./StatCard.schema.js";

const TONE_CLASSES = {
  neutral: "text-slate-900",
  success: "text-green-700",
  warning: "text-amber-700",
  danger: "text-red-700",
} as const;

const TREND_ARROW = { up: "▲", down: "▼", flat: "▬" } as const;

/**
 * StatCard — one KPI: label, value, optional unit, trend (word + arrow, never colour alone) and
 * change. Skeleton while `loading`; an empty state for `{}` (ChatGPT entrypoint default).
 * WCAG-AA: a labelled region; the trend is stated in text.
 */
export function StatCard(raw: StatCardProps) {
  const parsed = StatCardPropsSchema.safeParse(raw);
  const locale: MosaicLocale =
    (raw as { locale?: string } | undefined)?.locale === "fr" ? "fr" : "en";
  if (!parsed.success) {
    return <div role="alert">{t("StatCard.error.invalidProps", locale)}</div>;
  }
  const p = parsed.data;
  if (p.loading) {
    return (
      <div aria-busy="true" aria-label={t("StatCard.loading", p.locale)}>
        <Skeleton variant="rect" height={72} locale={p.locale} />
      </div>
    );
  }
  if (p.label === "" && p.value === "") {
    return <EmptyState title={t("StatCard.empty.message", p.locale)} locale={p.locale} />;
  }
  return (
    <section
      aria-label={`${t("StatCard.title", p.locale)}: ${p.label}`}
      lang={p.locale}
      className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4"
    >
      <span className="text-sm text-slate-500">{p.label}</span>
      <span className={`text-2xl font-semibold tabular-nums ${TONE_CLASSES[p.tone]}`}>
        {p.value}
        {p.unit ? (
          <span className="ml-1 text-base font-normal text-slate-500">{p.unit}</span>
        ) : null}
      </span>
      {p.trend || p.change ? (
        <span className="flex items-center gap-1 text-sm text-slate-600">
          {p.trend ? (
            <>
              <span aria-hidden="true">{TREND_ARROW[p.trend]}</span>
              <span>{t(`StatCard.trend.${p.trend}`, p.locale)}</span>
            </>
          ) : null}
          {p.change ? <span className="tabular-nums">{p.change}</span> : null}
        </span>
      ) : null}
      {p.description ? <span className="text-sm text-slate-500">{p.description}</span> : null}
    </section>
  );
}
