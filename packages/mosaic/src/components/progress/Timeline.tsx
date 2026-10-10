// i18nKeys: Timeline.title, Timeline.status.done, Timeline.status.current, Timeline.status.pending, Timeline.status.blocked, Timeline.completed, Timeline.more, Timeline.empty.message, Timeline.loading, Timeline.error.invalidProps

import React from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import { formatTimestamp } from "../shared/datetime.js";
import { visibleSteps } from "./Timeline.logic.js";
import { type TimelineProps, TimelinePropsSchema } from "./Timeline.schema.js";

const MARKER = { done: "✓", current: "●", pending: "○", blocked: "!" } as const;
const MARKER_TONE = {
  done: "text-green-700",
  current: "text-blue-700",
  pending: "text-slate-400",
  blocked: "text-red-700",
} as const;

/**
 * Timeline — mission steps as an ordered list (vertical or horizontal). Status is stated in words
 * next to a marker (never colour alone); the current step carries `aria-current="step"`.
 * `compact` is the Claude inline form: current + next step with counts of what is hidden.
 */
export function Timeline(raw: TimelineProps = {}) {
  const parsed = TimelinePropsSchema.safeParse(raw);
  const locale: MosaicLocale =
    (raw as { locale?: string } | undefined)?.locale === "fr" ? "fr" : "en";
  if (!parsed.success) {
    return <div role="alert">{t("Timeline.error.invalidProps", locale)}</div>;
  }
  const p = parsed.data;
  if (p.loading) {
    return (
      <div aria-busy="true" aria-label={t("Timeline.loading", p.locale)}>
        <Skeleton variant="text" count={4} locale={p.locale} />
      </div>
    );
  }
  if (p.steps.length === 0) {
    return <EmptyState title={t("Timeline.empty.message", p.locale)} locale={p.locale} />;
  }
  const { visible, hiddenBefore, hiddenAfter } = visibleSteps(p.steps, p.compact);
  const horizontal = p.orientation === "horizontal";
  return (
    <section
      aria-label={t("Timeline.title", p.locale)}
      lang={p.locale}
      className="flex flex-col gap-2"
    >
      {hiddenBefore > 0 ? (
        <span className="text-sm text-slate-500">
          {t("Timeline.completed", p.locale).replace("{n}", String(hiddenBefore))}
        </span>
      ) : null}
      <ol
        data-orientation={p.orientation}
        className={`m-0 flex list-none gap-3 p-0 ${horizontal ? "flex-row overflow-x-auto" : "flex-col"}`}
        style={{
          scrollPaddingLeft: "var(--mosaic-safe-area-left, 0px)",
          scrollPaddingRight: "var(--mosaic-safe-area-right, 0px)",
        }}
      >
        {visible.map((s, i) => (
          <li
            key={s.id ?? `${s.title}-${i}`}
            aria-current={s.status === "current" ? "step" : undefined}
            className="flex min-w-0 gap-2"
          >
            <span aria-hidden="true" className={`font-bold ${MARKER_TONE[s.status]}`}>
              {MARKER[s.status]}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium text-slate-900">{s.title}</span>
              <span className="text-xs text-slate-500">
                {t(`Timeline.status.${s.status}`, p.locale)}
              </span>
              {s.description ? (
                <span className="text-sm text-slate-600">{s.description}</span>
              ) : null}
              {s.timestamp ? (
                <span className="text-xs text-slate-500">
                  {formatTimestamp(s.timestamp, p.locale, p.timeZone)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      {hiddenAfter > 0 ? (
        <span className="text-sm text-slate-500">
          {t("Timeline.more", p.locale).replace("{n}", String(hiddenAfter))}
        </span>
      ) : null}
    </section>
  );
}
