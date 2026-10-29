// i18nKeys: DetailView.title, DetailView.empty.message, DetailView.loading, DetailView.error.invalidProps

import React, { useId } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import { formatValue, isNumericFormat } from "../shared/format.js";
import { type DetailViewProps, DetailViewPropsSchema } from "./DetailView.schema.js";
import { TableView } from "./TableView.js";

/**
 * DetailView — one record as sections of labelled fields (a description list) and nested tables.
 * Skeleton while `loading`; an empty state for `{}`; role="alert" on invalid props.
 * WCAG-AA: an article named by its title, one heading per section, native dl / dt / dd.
 */
export function DetailView(raw: DetailViewProps) {
  const parsed = DetailViewPropsSchema.safeParse(raw);
  const locale: MosaicLocale =
    (raw as { locale?: string } | undefined)?.locale === "fr" ? "fr" : "en";
  const uid = useId();
  if (!parsed.success) {
    return <div role="alert">{t("DetailView.error.invalidProps", locale)}</div>;
  }
  const p = parsed.data;
  if (p.loading) {
    return (
      <div aria-busy="true" aria-label={t("DetailView.loading", p.locale)}>
        <Skeleton variant="rect" height={96} locale={p.locale} />
      </div>
    );
  }
  if (p.title === "" && p.sections.length === 0) {
    return <EmptyState title={t("DetailView.empty.message", p.locale)} locale={p.locale} />;
  }
  return (
    <article
      aria-label={p.title || t("DetailView.title", p.locale)}
      lang={p.locale}
      className="mosaic-detail"
    >
      {p.title ? <h2>{p.title}</h2> : null}
      {p.sections.map((s) => (
        <section key={s.id} aria-labelledby={`${uid}-${s.id}`}>
          <h3 id={`${uid}-${s.id}`}>{s.title}</h3>
          {s.fields.length > 0 ? (
            <dl className="mosaic-detail-fields">
              {s.fields.map((f) => (
                <div key={f.label} className="mosaic-detail-field">
                  <dt>{f.label}</dt>
                  <dd
                    style={
                      isNumericFormat(f.format)
                        ? { fontVariantNumeric: "tabular-nums", margin: 0 }
                        : { margin: 0 }
                    }
                  >
                    {formatValue(f.value, f.format, p.locale)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {s.table ? (
            <TableView
              ariaLabel={s.title}
              locale={p.locale}
              columns={s.table.columns}
              rows={s.table.rows}
            />
          ) : null}
        </section>
      ))}
    </article>
  );
}
