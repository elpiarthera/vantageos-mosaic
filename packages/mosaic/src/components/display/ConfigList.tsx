// i18nKeys: ConfigList.paging.more, ConfigList.paging.loading, ConfigList.truncated, ConfigList.actions.header, ConfigList.empty.message, ConfigList.totals.incomplete, ConfigList.totals.scope, ConfigView.error.invalidConfig, ConfigView.error.invalidData

import React, { useId, useState } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import {
  type ConfigToolResult,
  type ConfigViewBridge,
  type ListViewConfig,
  actionVisible,
  listRows,
  pagingState,
  parseViewConfig,
  pick,
  toColumnDefs,
} from "../../view-config/view-config.js";
import { columnText, formatValue } from "../shared/format.js";
import { getPath } from "../shared/path.js";
import { resolveConfigLocale } from "./ConfigList.schema.js";
import { ActionButton, ErrorAlert, Refusal, useToolRunner } from "./ConfigView.shared.js";
import { TableView } from "./TableView.js";
import type { ColumnDef } from "./TableView.schema.js";

export interface ConfigListProps {
  /** The view config (`kind: "list"`); validated at runtime, refused visibly when invalid. */
  config: unknown;
  /** The tool's `structuredContent`. */
  payload: unknown;
  locale?: MosaicLocale;
  /** The arguments of the call that produced `payload`, re-sent with the cursor to page. */
  toolArgs?: Record<string, unknown>;
  /** The bridge (`App.callServerTool`); without it paging and actions are disabled. */
  bridge?: ConfigViewBridge;
  /** Receives the result of a row action so the host shell can show it. */
  onResult?: (result: ConfigToolResult) => void;
}

/**
 * ConfigList — a list view described by data: columns with formats, sort, paging ("la suite")
 * through the cursor, row actions calling another tool. The config is validated at runtime; an
 * invalid config or a payload that does not match renders a visible refusal.
 * Keyed by the caller per result: state starts from `payload` once.
 */
export function ConfigList(props: ConfigListProps) {
  const locale: MosaicLocale = resolveConfigLocale(props.locale);
  const parsed = parseViewConfig(props.config);
  if (!parsed.ok) return <Refusal kind="invalidConfig" issues={parsed.issues} locale={locale} />;
  if (parsed.config.kind !== "list") {
    return <Refusal kind="invalidConfig" issues={[`kind: expected "list"`]} locale={locale} />;
  }
  const first = listRows(parsed.config, props.payload);
  if (!first.ok) {
    return (
      <Refusal
        kind="invalidData"
        issues={[`${parsed.config.dataPath}: not a list`]}
        locale={locale}
      />
    );
  }
  return <ListBody {...props} locale={locale} config={parsed.config} rows0={first.rows} />;
}

function ListBody({
  config,
  payload,
  locale,
  toolArgs,
  bridge,
  onResult,
  rows0,
}: Omit<ConfigListProps, "config" | "locale"> & {
  config: ListViewConfig;
  locale: MosaicLocale;
  rows0: Record<string, unknown>[];
}) {
  const uid = useId();
  const [rows, setRows] = useState(rows0);
  const [latest, setLatest] = useState(payload);
  const runner = useToolRunner(bridge, locale);
  const paging = pagingState(config, latest);
  const columns: ColumnDef[] = toColumnDefs(config.columns, locale);
  const actions = config.rowActions ?? [];

  if (actions.length > 0) {
    columns.push({
      key: "__actions",
      header: t("ConfigList.actions.header", locale),
      render: (row) => (
        <span className="mosaic-actions">
          {actions
            .filter((a) => actionVisible(a, { row }))
            .map((a) => (
              <ActionButton
                key={a.tool}
                action={a}
                locale={locale}
                disabled={!runner.canCall || runner.busy}
                ariaLabel={`${pick(a.label, locale)}: ${columnText(row, columns[0] as ColumnDef, locale)}`}
                onClick={async () => {
                  const res = await runner.runAction(a, { row });
                  if (res) onResult?.(res);
                }}
              />
            ))}
        </span>
      ),
    });
  }

  async function loadMore() {
    const p = config.paging;
    const args: Record<string, unknown> = {
      ...toolArgs,
      [p?.cursorArg ?? "cursor"]: paging.cursor,
    };
    if (p?.limitArg && p.pageSize) args[p.limitArg] = p.pageSize;
    const res = await runner.call(config.tool, args);
    if (!res) return;
    const next = listRows(config, res.structuredContent);
    if (!next.ok) {
      runner.setError(`${t("ConfigView.error.invalidData", locale)}: ${config.dataPath}`);
      return;
    }
    setRows((prev) => [...prev, ...next.rows]);
    setLatest(res.structuredContent);
  }

  const complete = config.totalsScope?.completePath
    ? getPath(latest, config.totalsScope.completePath)
    : undefined;
  const note = config.totalsScope?.notePath
    ? getPath(latest, config.totalsScope.notePath)
    : undefined;
  const scope = config.totalsScope?.scopePath
    ? getPath(latest, config.totalsScope.scopePath)
    : undefined;
  const scopeText = typeof scope === "string" && scope !== "" ? scope : undefined;
  const incomplete = complete === false;
  const empty = config.emptyMessage
    ? pick(config.emptyMessage, locale)
    : t("ConfigList.empty.message", locale);

  return (
    <section aria-labelledby={`${uid}-h`} lang={locale} className="mosaic-list">
      <h2 id={`${uid}-h`}>{pick(config.title, locale)}</h2>
      {rows.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <TableView
          ariaLabel={pick(config.title, locale)}
          locale={locale}
          columns={columns}
          rows={rows}
          {...(config.rowKey ? { rowKey: config.rowKey } : {})}
          {...(config.defaultSort
            ? {
                defaultSort: {
                  key: config.defaultSort.column,
                  direction: config.defaultSort.direction,
                },
              }
            : {})}
        />
      )}
      {config.totals && config.totals.length > 0 ? (
        <dl className="mosaic-detail-fields">
          {config.totals.map((f) => (
            <div key={f.path} className="mosaic-detail-field">
              <dt>{pick(f.label, locale)}</dt>
              <dd style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}>
                {formatValue(getPath(latest, f.path), f.format, locale)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {incomplete ? (
        <output>
          {t("ConfigList.totals.incomplete", locale)}
          {scopeText ? `. ${t("ConfigList.totals.scope", locale)}: ${scopeText}` : ""}
          {typeof note === "string" && note !== "" ? `. ${note}` : ""}
        </output>
      ) : scopeText ? (
        <p>{`${t("ConfigList.totals.scope", locale)}: ${scopeText}`}</p>
      ) : null}
      {paging.truncated ? <p>{t("ConfigList.truncated", locale)}</p> : null}
      <ErrorAlert message={runner.error} />
      {paging.cursor && !paging.exhausted ? (
        <button
          type="button"
          className="mosaic-action"
          disabled={!runner.canCall || runner.busy}
          onClick={loadMore}
        >
          {runner.busy
            ? t("ConfigList.paging.loading", locale)
            : t("ConfigList.paging.more", locale)}
        </button>
      ) : null}
    </section>
  );
}
