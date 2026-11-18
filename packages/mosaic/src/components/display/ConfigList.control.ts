/**
 * Model-drivable list state (MCP Apps "app tools"): sort, filter and selection of an open
 * ConfigList, held in a ref so a tool call that arrives between two renders still sees (and
 * returns) the state it just changed. Everything is local: no server call for any of it.
 *
 * A `ListRegistry` is the one door between the shell's tools (config-view/appTools.ts) and the
 * list that is on screen: the list attaches while mounted, the tools read `current()`.
 */
import { useEffect, useReducer, useRef } from "react";
import type { MosaicLocale } from "../../i18n/strings.js";
import {
  type ConfigToolResult,
  type ListViewConfig,
  type ViewConfigRowAction,
  actionVisible,
  pick,
} from "../../view-config/view-config.js";
import { columnText } from "../shared/format.js";
import { getPath } from "../shared/path.js";
import { cellValue, kindOf } from "./TableView.js";
import { type SortState, sortItems } from "./TableView.logic.js";
import type { ColumnDef } from "./TableView.schema.js";

type Row = Record<string, unknown>;

/** The key field the list writes on the rows it hands to TableView (never read from the payload). */
export const LIST_KEY_FIELD = "__mosaicKey";

/** What the model is told about the list on screen. */
export interface ListInfo {
  title: string;
  tool: string;
  locale: MosaicLocale;
  columns: Array<{ key: string; header: string }>;
  loaded: number;
  shown: number;
  sort: SortState | undefined;
  filter: { column: string; value: string } | undefined;
  /** Model-facing keys of the selected rows that are displayed. */
  selected: string[];
  hasMore: boolean;
  /** True when the view declares a rowKey (keys are its values), else keys are displayed indexes. */
  keyed: boolean;
  /** Displayed rows in order: model key and the text of the first column. */
  rows: Array<{ key: string; label: string }>;
}

export type OpenOutcome =
  | { kind: "none-selected" }
  | { kind: "no-action" }
  | { kind: "choose"; tools: string[] }
  | { kind: "unknown"; tools: string[]; asked: string }
  | { kind: "done"; tool: string; ok: number; failed: string[] };

export interface ListHandle {
  info(): ListInfo;
  setSort(sort: SortState | undefined): void;
  setFilter(filter: { column: string; value: string } | undefined): void;
  /** Replaces the selection; returns the keys that matched no displayed row. */
  select(keys: string[]): { unknown: string[] };
  openSelected(tool?: string): Promise<OpenOutcome>;
}

export interface ListRegistry {
  attach(handle: ListHandle): () => void;
  current(): ListHandle | undefined;
}

export function createListRegistry(): ListRegistry {
  let current: ListHandle | undefined;
  return {
    attach(handle) {
      current = handle;
      return () => {
        if (current === handle) current = undefined;
      };
    },
    current: () => current,
  };
}

interface Inputs {
  registry: ListRegistry | undefined;
  config: ListViewConfig;
  rows: Row[];
  locale: MosaicLocale;
  /** The data columns (no actions column). */
  columns: ColumnDef[];
  hasMore: boolean;
  runAction: (
    action: ViewConfigRowAction,
    scope: { row: Row },
  ) => Promise<{ result: ConfigToolResult; args: Record<string, unknown> } | undefined>;
  onResult: ((result: ConfigToolResult, args: Record<string, unknown>) => void) | undefined;
}

interface State {
  sort: SortState | undefined;
  filter: { column: string; value: string } | undefined;
  selected: Set<string>;
  /** The selection column appears once a tool selected something (the view is unchanged before). */
  engaged: boolean;
}

interface Item {
  key: string;
  row: Row;
}

/** Case- and accent-insensitive form used by the filter. */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function stableKey(config: ListViewConfig, row: Row, index: number): string {
  const v = config.rowKey ? getPath(row, config.rowKey) : undefined;
  return v !== undefined && v !== null ? String(v) : `i${index}`;
}

function displayed(a: Inputs, s: State): Item[] {
  let items: Item[] = a.rows.map((row, i) => ({ row, key: stableKey(a.config, row, i) }));
  const fcol = s.filter ? a.columns.find((c) => c.key === s.filter?.column) : undefined;
  if (s.filter && fcol) {
    const needle = fold(s.filter.value);
    items = items.filter((it) => fold(columnText(it.row, fcol, a.locale)).includes(needle));
  }
  const scol = s.sort ? a.columns.find((c) => c.key === s.sort?.key) : undefined;
  if (s.sort && scol) {
    items = sortItems(
      items,
      (it) => cellValue(it.row, scol),
      kindOf(scol),
      s.sort.direction,
      a.locale,
    );
  }
  return items;
}

function makeHandle(
  inputs: { current: Inputs },
  st: { current: State },
  bump: () => void,
): ListHandle {
  const modelKey = (a: Inputs, it: Item, i: number) => (a.config.rowKey ? it.key : String(i));
  return {
    info() {
      const a = inputs.current;
      const items = displayed(a, st.current);
      const first = a.columns[0];
      return {
        title: pick(a.config.title, a.locale),
        tool: a.config.tool,
        locale: a.locale,
        columns: a.columns.map((c) => ({ key: c.key, header: c.header })),
        loaded: a.rows.length,
        shown: items.length,
        sort: st.current.sort,
        filter: st.current.filter,
        selected: items.flatMap((it, i) =>
          st.current.selected.has(it.key) ? [modelKey(a, it, i)] : [],
        ),
        hasMore: a.hasMore,
        keyed: a.config.rowKey !== undefined,
        rows: items.map((it, i) => ({
          key: modelKey(a, it, i),
          label: first ? columnText(it.row, first, a.locale) : "",
        })),
      };
    },
    setSort(sort) {
      st.current = { ...st.current, sort };
      bump();
    },
    setFilter(filter) {
      const a = inputs.current;
      const next = { ...st.current, filter };
      // A selected row the filter hides leaves the selection: what is acted on is what is shown.
      const visible = new Set(displayed(a, next).map((it) => it.key));
      st.current = { ...next, selected: new Set([...next.selected].filter((k) => visible.has(k))) };
      bump();
    },
    select(keys) {
      const a = inputs.current;
      const items = displayed(a, st.current);
      const chosen = new Set<string>();
      const unknown: string[] = [];
      for (const k of keys) {
        const hit = a.config.rowKey
          ? items.find((it) => it.key === k)
          : /^\d+$/.test(k)
            ? items[Number(k)]
            : undefined;
        if (hit) chosen.add(hit.key);
        else unknown.push(k);
      }
      st.current = { ...st.current, selected: chosen, engaged: true };
      bump();
      return { unknown };
    },
    async openSelected(tool) {
      const a = inputs.current;
      const rows = displayed(a, st.current)
        .map((it, i) => ({ it, key: modelKey(a, it, i) }))
        .filter((x) => st.current.selected.has(x.it.key));
      if (rows.length === 0) return { kind: "none-selected" };
      const declared = a.config.rowActions ?? [];
      if (declared.length === 0) return { kind: "no-action" };
      const tools = [...new Set(declared.map((x) => x.tool))];
      if (tool !== undefined && !tools.includes(tool)) {
        return { kind: "unknown", tools, asked: tool };
      }
      if (tool === undefined && tools.length > 1) return { kind: "choose", tools };
      const name = tool ?? (tools[0] as string);
      const action = declared.find((x) => x.tool === name) as ViewConfigRowAction;
      let ok = 0;
      const failed: string[] = [];
      for (const { it, key } of rows) {
        if (!actionVisible(action, { row: it.row })) {
          failed.push(key);
          continue;
        }
        // The view may have re-rendered (an earlier result is pushed on screen): read the live inputs.
        const live = inputs.current;
        const res = await live.runAction(action, { row: it.row });
        if (res) {
          live.onResult?.(res.result, res.args);
          ok += 1;
        } else failed.push(key);
      }
      return { kind: "done", tool: name, ok, failed };
    },
  };
}

/** The list's tool-driven state, and what TableView needs to show it. */
export function useListControl(a: Inputs) {
  const inputs = useRef(a);
  inputs.current = a;
  const st = useRef<State>({
    sort: a.config.defaultSort
      ? { key: a.config.defaultSort.column, direction: a.config.defaultSort.direction }
      : undefined,
    filter: undefined,
    selected: new Set(),
    engaged: false,
  });
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const handle = useRef<ListHandle | undefined>(undefined);
  if (!handle.current) handle.current = makeHandle(inputs, st, bump as () => void);
  const registry = a.registry;
  useEffect(
    () => (registry && handle.current ? registry.attach(handle.current) : undefined),
    [registry],
  );

  const s = st.current;
  const rows = displayed(a, s).map((it) => ({ ...it.row, [LIST_KEY_FIELD]: it.key }));
  return {
    rows,
    sort: s.sort ?? null,
    onSortChange: (sort: SortState | undefined) => {
      st.current = { ...st.current, sort };
      bump();
    },
    selectionMode: s.engaged ? ("multiple" as const) : ("none" as const),
    selectedKeys: [...s.selected],
    onSelectionChange: (_rows: unknown[], keys: string[]) => {
      st.current = { ...st.current, selected: new Set(keys) };
      bump();
    },
  };
}
