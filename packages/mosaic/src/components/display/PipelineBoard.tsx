// i18nKeys: PipelineBoard.title, PipelineBoard.deals.one, PipelineBoard.deals.many, PipelineBoard.total, PipelineBoard.stage.empty, PipelineBoard.filter.label, PipelineBoard.summary.open, PipelineBoard.more, PipelineBoard.empty.message, PipelineBoard.loading, PipelineBoard.error.invalidProps, PipelineBoard.col.stage, PipelineBoard.col.deals

import React, { useState } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { Badge } from "../../runtimes/react/components/display/Badge.js";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import { getOptionLabelClasses } from "../forms/RadioGroup.logic.js";
import { formatDecimalString } from "../shared/decimal.js";
import { isHttpUrl } from "../shared/url.js";
import { SUMMARY_STAGE_LIMIT, stageSummary } from "./PipelineBoard.logic.js";
import {
  type PipelineBoardProps,
  PipelineBoardPropsSchema,
  type PipelineStage,
} from "./PipelineBoard.schema.js";

export type PipelineBoardViewProps = PipelineBoardProps & {
  /** Summary layout: ask the host for fullscreen (`requestDisplayMode` in ./host). */
  onRequestFullscreen?: () => void;
  /** Deal links go through the host (`ui/open-link`); without it deals with a url are plain text. */
  onOpenLink?: (url: string) => void;
};

function dealsLabel(n: number, locale: MosaicLocale): string {
  return n === 1
    ? t("PipelineBoard.deals.one", locale)
    : t("PipelineBoard.deals.many", locale).replace("{n}", String(n));
}

function Totals({
  stage,
  currency,
  locale,
}: { stage: PipelineStage; currency: string; locale: MosaicLocale }) {
  const { count, total } = stageSummary(stage.deals);
  return (
    <span className="flex flex-col text-sm text-slate-600">
      <span>{dealsLabel(count, locale)}</span>
      <span className="tabular-nums">
        {total === undefined ? "—" : formatDecimalString(total, locale, currency)}
      </span>
    </span>
  );
}

/**
 * PipelineBoard — deals by stage, READ-ONLY. `board`: one labelled column per stage with stage
 * filter chips (R25); `summary`: the inline stage-totals card. No drag-and-drop and no stage
 * change (R07 deferred). Horizontal pan only; scroll padding honours the host safe-area insets.
 */
export function PipelineBoard(raw: PipelineBoardViewProps = {}) {
  const parsed = PipelineBoardPropsSchema.safeParse(raw);
  const locale: MosaicLocale =
    (raw as { locale?: string } | undefined)?.locale === "fr" ? "fr" : "en";
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  if (!parsed.success) {
    return <div role="alert">{t("PipelineBoard.error.invalidProps", locale)}</div>;
  }
  const p = parsed.data;
  if (p.loading) {
    return (
      <div aria-busy="true" aria-label={t("PipelineBoard.loading", p.locale)}>
        <Skeleton variant="rect" height={160} locale={p.locale} />
      </div>
    );
  }
  if (p.stages.length === 0) {
    return <EmptyState title={t("PipelineBoard.empty.message", p.locale)} locale={p.locale} />;
  }

  if (p.layout === "summary") {
    const shown = p.stages.slice(0, SUMMARY_STAGE_LIMIT);
    const rest = p.stages.length - shown.length;
    return (
      <section
        aria-label={t("PipelineBoard.title", p.locale)}
        lang={p.locale}
        className="flex flex-col gap-2"
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-900">{s.name}</span>
              <Totals stage={s} currency={p.currency} locale={p.locale} />
            </li>
          ))}
        </ul>
        {rest > 0 ? (
          <span className="text-sm text-slate-500">
            {t("PipelineBoard.more", p.locale).replace("{n}", String(rest))}
          </span>
        ) : null}
        {raw.onRequestFullscreen ? (
          <button
            type="button"
            onClick={raw.onRequestFullscreen}
            className="self-start rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            {t("PipelineBoard.summary.open", p.locale)}
          </button>
        ) : null}
      </section>
    );
  }

  const visible = p.stages.filter((s) => !hidden.has(s.id));
  const toggle = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else if (visible.length > 1) next.add(id); // keep at least one stage on screen
    setHidden(next);
  };
  return (
    <section
      aria-label={t("PipelineBoard.title", p.locale)}
      lang={p.locale}
      className="flex flex-col gap-3"
    >
      <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
        <legend className="sr-only">{t("PipelineBoard.filter.label", p.locale)}</legend>
        {p.stages.map((s) => {
          const on = !hidden.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.id)}
              className={getOptionLabelClasses("chips", on)}
            >
              {s.name}
            </button>
          );
        })}
      </fieldset>
      <div
        className="flex flex-row gap-3 overflow-x-auto"
        style={{
          scrollPaddingLeft: "var(--mosaic-safe-area-left, 0px)",
          scrollPaddingRight: "var(--mosaic-safe-area-right, 0px)",
        }}
      >
        {visible.map((s) => (
          <section
            key={s.id}
            aria-label={s.name}
            className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <header className="flex items-start justify-between gap-2">
              <strong className="text-slate-900">{s.name}</strong>
              <Totals stage={s} currency={p.currency} locale={p.locale} />
            </header>
            {s.deals.length === 0 ? (
              <span className="text-sm text-slate-500">
                {t("PipelineBoard.stage.empty", p.locale)}
              </span>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {s.deals.map((d) => (
                  <li key={d.id} className="rounded border border-slate-200 bg-white p-2">
                    {raw.onOpenLink && isHttpUrl(d.url) ? (
                      <button
                        type="button"
                        onClick={() => raw.onOpenLink?.(d.url as string)}
                        className="text-left font-medium text-blue-700 underline"
                      >
                        {d.title}
                      </button>
                    ) : (
                      <span className="font-medium text-slate-900">{d.title}</span>
                    )}
                    {d.amount !== undefined ? (
                      <span className="block text-sm tabular-nums text-slate-700">
                        {formatDecimalString(d.amount, p.locale, p.currency)}
                      </span>
                    ) : null}
                    {d.contact ? (
                      <Badge label={d.contact} variant="neutral" locale={p.locale} />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
