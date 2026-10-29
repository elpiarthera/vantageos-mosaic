// i18nKeys: ConfigDetail.choose, ConfigDetail.record, ConfigDetail.actions, ConfigDetail.empty.message, ConfigView.back, ConfigView.error.invalidConfig, ConfigView.error.invalidData

import React, { useId, useState } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import {
  type ConfigToolResult,
  type ConfigViewBridge,
  type DetailViewConfig,
  actionVisible,
  buildDetailViewProps,
  detailRecords,
  parseViewConfig,
  pick,
  recordLabel,
} from "../../view-config/view-config.js";
import { resolveConfigLocale } from "./ConfigList.schema.js";
import { ActionButton, ErrorAlert, Refusal, useToolRunner } from "./ConfigView.shared.js";
import { DetailView } from "./DetailView.js";

export interface ConfigDetailProps {
  /** The view config (`kind: "detail"`); validated at runtime, refused visibly when invalid. */
  config: unknown;
  /** The tool's `structuredContent`. */
  payload: unknown;
  locale?: MosaicLocale;
  bridge?: ConfigViewBridge;
  /** Receives the result of an action so the host shell can show it. */
  onResult?: (result: ConfigToolResult) => void;
}

/**
 * ConfigDetail — a detail view described by data: sections of labelled, formatted fields and
 * nested tables, actions calling other tools. `dataPath` may hold one record (rendered) or several
 * (a chooser first); `"$"` reads the whole payload the same way. Invalid config or mismatching payload: a visible refusal.
 */
export function ConfigDetail(props: ConfigDetailProps) {
  const locale: MosaicLocale = resolveConfigLocale(props.locale);
  const parsed = parseViewConfig(props.config);
  if (!parsed.ok) return <Refusal kind="invalidConfig" issues={parsed.issues} locale={locale} />;
  if (parsed.config.kind !== "detail") {
    return <Refusal kind="invalidConfig" issues={[`kind: expected "detail"`]} locale={locale} />;
  }
  const found = detailRecords(parsed.config, props.payload);
  if (!found.ok) {
    return (
      <Refusal
        kind="invalidData"
        issues={[`${parsed.config.dataPath}: not a record or a list of records`]}
        locale={locale}
      />
    );
  }
  return (
    <DetailBody
      config={parsed.config}
      records={found.records}
      locale={locale}
      bridge={props.bridge}
      onResult={props.onResult}
    />
  );
}

function DetailBody({
  config,
  records,
  locale,
  bridge,
  onResult,
}: {
  config: DetailViewConfig;
  records: Record<string, unknown>[];
  locale: MosaicLocale;
  bridge?: ConfigViewBridge;
  onResult?: (result: ConfigToolResult) => void;
}) {
  const uid = useId();
  const [selected, setSelected] = useState<number | undefined>(
    records.length === 1 ? 0 : undefined,
  );
  const runner = useToolRunner(bridge, locale);
  const title = pick(config.title, locale);

  if (records.length === 0) {
    return <p lang={locale}>{t("ConfigDetail.empty.message", locale)}</p>;
  }
  if (selected === undefined) {
    return (
      <section aria-labelledby={`${uid}-h`} lang={locale}>
        <h2 id={`${uid}-h`}>{title}</h2>
        <p id={`${uid}-c`}>{t("ConfigDetail.choose", locale)}</p>
        <ul aria-labelledby={`${uid}-c`}>
          {records.map((r, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: records have no stable id in the config
            <li key={i}>
              <button type="button" className="mosaic-action" onClick={() => setSelected(i)}>
                {recordLabel(config, r) ??
                  t("ConfigDetail.record", locale).replace("{n}", String(i + 1))}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  const record = records[selected];
  const built = buildDetailViewProps(config, record, locale);
  if (!built.ok) return <Refusal kind="invalidData" issues={built.issues} locale={locale} />;
  const actions = (config.rowActions ?? []).filter((a) => actionVisible(a, { record }));
  return (
    <div lang={locale}>
      {records.length > 1 ? (
        <button type="button" className="mosaic-action" onClick={() => setSelected(undefined)}>
          {t("ConfigView.back", locale)}
        </button>
      ) : null}
      <DetailView {...built.props} />
      {actions.length > 0 ? (
        // biome-ignore lint/a11y/useSemanticElements: a fieldset would add a border and legend box to a row of buttons; role=group + aria-label is the non-structural grouping
        <div role="group" aria-label={t("ConfigDetail.actions", locale)} className="mosaic-actions">
          {actions.map((a) => (
            <ActionButton
              key={a.tool}
              action={a}
              locale={locale}
              disabled={!runner.canCall || runner.busy}
              onClick={async () => {
                const res = await runner.runAction(a, { record });
                if (res) onResult?.(res);
              }}
            />
          ))}
        </div>
      ) : null}
      <ErrorAlert message={runner.error} />
    </div>
  );
}
