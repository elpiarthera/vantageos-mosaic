import { type MosaicLocale, t } from "../../i18n/strings.js";
import {
  type DetailViewConfig,
  type ListViewConfig,
  ViewConfigError,
  assertViewConfig,
  buildDetailViewProps,
  detailRecords,
  listRows,
  pagingState,
  pick,
  toColumnDefs,
} from "../../view-config/view-config.js";
import { columnText, formatValue } from "../shared/format.js";
import { mdCode, mdEscape, mdHeading, mdTable } from "../shared/markdown.js";
import { getPath } from "../shared/path.js";
import { detailViewToMarkdown } from "./DetailView.markdown.js";
import { MARKDOWN_MAX_ROWS } from "./TableView.markdown.js";

function listToMarkdown(config: ListViewConfig, payload: unknown, locale: MosaicLocale): string {
  const found = listRows(config, payload);
  if (!found.ok) throw new ViewConfigError([`${config.dataPath}: not a list`]);
  const columns = toColumnDefs(config.columns, locale);
  const shown = found.rows.slice(0, MARKDOWN_MAX_ROWS);
  const out: string[] = [mdHeading(mdEscape(pick(config.title, locale)))];
  if (found.rows.length === 0) {
    const empty = config.emptyMessage
      ? pick(config.emptyMessage, locale)
      : t("ConfigList.empty.message", locale);
    out.push(`\n${mdEscape(empty)}`);
  } else {
    out.push(
      `\n${mdTable(
        columns.map((c) => mdEscape(c.header)),
        shown.map((r) => columns.map((c) => mdEscape(columnText(r, c, locale)))),
      )}`,
    );
  }
  const rest = found.rows.length - shown.length;
  if (rest > 0) out.push(`\n${t("ConfigList.markdown.more", locale).replace("{n}", String(rest))}`);
  for (const f of config.totals ?? []) {
    out.push(
      `- **${mdEscape(pick(f.label, locale))}**: ${mdEscape(formatValue(getPath(payload, f.path), f.format, locale))}`,
    );
  }
  const scope = config.totalsScope;
  if (scope?.completePath && getPath(payload, scope.completePath) === false) {
    const note = scope.notePath ? getPath(payload, scope.notePath) : undefined;
    out.push(
      `\n${t("ConfigList.totals.incomplete", locale)}${typeof note === "string" && note !== "" ? `. ${mdEscape(note)}` : ""}`,
    );
  }
  const paging = pagingState(config, payload);
  if (paging.truncated) out.push(`\n${t("ConfigList.truncated", locale)}`);
  if (paging.cursor && !paging.exhausted) {
    out.push(
      `\n${t("ConfigList.markdown.cursor", locale)
        .replace("{arg}", mdEscape(config.paging?.cursorArg ?? "cursor"))
        .replace("{cursor}", mdCode(paging.cursor))}`,
    );
  }
  return `${out.join("\n")}\n`;
}

function detailToMarkdown(
  config: DetailViewConfig,
  payload: unknown,
  locale: MosaicLocale,
): string {
  const found = detailRecords(config, payload);
  if (!found.ok) {
    throw new ViewConfigError([`${config.dataPath}: not a record or a list of records`]);
  }
  if (found.records.length === 0) {
    return `${mdHeading(mdEscape(pick(config.title, locale)))}\n\n${t("ConfigDetail.empty.message", locale)}\n`;
  }
  return found.records
    .map((record) => {
      const built = buildDetailViewProps(config, record, locale);
      if (!built.ok) throw new ViewConfigError(built.issues);
      return detailViewToMarkdown(built.props, locale);
    })
    .join("\n");
}

/**
 * A-1 fallback for a config-driven view: the same data as markdown, from the same config, for a
 * client with no UI layer (and what a text-only model reads). LOUD by design: an invalid config
 * or a payload that does not match throws `ViewConfigError` naming the problem; the caller
 * decides how to answer, nothing is silently defaulted.
 */
export function configToMarkdown(
  viewConfig: unknown,
  payload: unknown,
  locale: MosaicLocale = "en",
): string {
  const config = assertViewConfig(viewConfig);
  return config.kind === "list"
    ? listToMarkdown(config, payload, locale)
    : detailToMarkdown(config, payload, locale);
}
