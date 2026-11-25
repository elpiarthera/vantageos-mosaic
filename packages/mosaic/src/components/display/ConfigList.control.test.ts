import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ConfigToolResult, ListViewConfig } from "../../view-config/view-config.js";
import { LIST_KEY_FIELD, createListRegistry, useListControl } from "./ConfigList.control.js";
import type { ColumnDef } from "./TableView.schema.js";

type Row = Record<string, unknown>;
type RunAction = Parameters<typeof useListControl>[0]["runAction"];

const ROWS: Row[] = [
  { id: "a", name: "Charlie", contract: "k-a" },
  { id: "b", name: "Alice", contract: null },
  { id: "c", name: "Bob", contract: "k-c" },
];
const COLUMNS: ColumnDef[] = [{ key: "name", header: "Name", path: "name", sortable: true }];

const OPEN = {
  tool: "open_contract",
  args: { id: "$row.id" },
  label: { en: "Open", fr: "Ouvrir" },
};

function listConfig(extra: Partial<ListViewConfig> = {}): ListViewConfig {
  return {
    schemaVersion: 1,
    tool: "list_people",
    kind: "list",
    title: { en: "People", fr: "Personnes" },
    dataPath: "people",
    rowKey: "id",
    columns: [{ id: "name", path: "name", label: { en: "Name", fr: "Nom" } }],
    ...extra,
  } as ListViewConfig;
}

function setup(
  opts: {
    config?: ListViewConfig;
    columns?: ColumnDef[];
    runAction?: RunAction;
    onResult?: (r: ConfigToolResult, args: Record<string, unknown>) => void;
  } = {},
) {
  const registry = createListRegistry();
  const runAction: RunAction =
    opts.runAction ?? vi.fn(async () => ({ result: { structuredContent: {} }, args: {} }));
  const hook = renderHook(() =>
    useListControl({
      registry,
      config: opts.config ?? listConfig(),
      rows: ROWS,
      locale: "en",
      columns: opts.columns ?? COLUMNS,
      hasMore: false,
      runAction,
      onResult: opts.onResult,
    }),
  );
  const handle = registry.current();
  if (!handle) throw new Error("the hook did not attach its handle to the registry");
  return { hook, handle, runAction };
}

const shownNames = (rows: Row[]) => rows.map((r) => r.name);

describe("useListControl: info()", () => {
  it("labels every row with an empty string when the list has no data column", () => {
    const { handle } = setup({ columns: [] });
    const info = handle.info();
    expect(info.columns).toEqual([]);
    expect(info.rows).toEqual([
      { key: "a", label: "" },
      { key: "b", label: "" },
      { key: "c", label: "" },
    ]);
  });
});

describe("useListControl: select() on a list without rowKey", () => {
  it("resolves digit keys as displayed indexes and reports any other key as unknown", () => {
    const { handle, hook } = setup({ config: listConfig({ rowKey: undefined }) });
    let out: { unknown: string[] } | undefined;
    act(() => {
      out = handle.select(["1", "b", "first"]);
    });
    expect(out?.unknown).toEqual(["b", "first"]);
    expect(handle.info().selected).toEqual(["1"]);
    expect(hook.result.current.selectedKeys).toEqual(["i1"]);
  });
});

describe("useListControl: openSelected()", () => {
  it("answers no-action when the view declares no rowActions at all", async () => {
    const { handle, runAction } = setup({ config: listConfig({ rowActions: undefined }) });
    act(() => {
      handle.select(["a"]);
    });
    await expect(handle.openSelected()).resolves.toEqual({ kind: "no-action" });
    expect(runAction).not.toHaveBeenCalled();
  });

  it("refuses a tool the view does not declare, naming the declared ones", async () => {
    const { handle, runAction } = setup({ config: listConfig({ rowActions: [OPEN] }) });
    act(() => {
      handle.select(["a"]);
    });
    await expect(handle.openSelected("delete_contract")).resolves.toEqual({
      kind: "unknown",
      tools: ["open_contract"],
      asked: "delete_contract",
    });
    expect(runAction).not.toHaveBeenCalled();
  });

  it("fails a selected row the action is not offered on, without calling the tool for it", async () => {
    const onResult = vi.fn();
    const { handle, runAction } = setup({
      config: listConfig({ rowActions: [{ ...OPEN, when: "contract" }] }),
      onResult,
    });
    act(() => {
      handle.select(["a", "b"]);
    });
    let outcome: unknown;
    await act(async () => {
      outcome = await handle.openSelected();
    });
    expect(outcome).toEqual({ kind: "done", tool: "open_contract", ok: 1, failed: ["b"] });
    expect(runAction).toHaveBeenCalledTimes(1);
    expect(vi.mocked(runAction).mock.calls[0]?.[1]).toEqual({ row: ROWS[0] });
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("counts a row whose action produced no result as failed, and pushes no result for it", async () => {
    const onResult = vi.fn();
    const runAction = vi.fn(async (_action: unknown, scope: { row: Row }) =>
      scope.row.id === "c" ? undefined : { result: { structuredContent: { ok: true } }, args: {} },
    ) as unknown as RunAction;
    const { handle } = setup({ config: listConfig({ rowActions: [OPEN] }), runAction, onResult });
    act(() => {
      handle.select(["a", "c"]);
    });
    let outcome: unknown;
    await act(async () => {
      outcome = await handle.openSelected("open_contract");
    });
    expect(outcome).toEqual({ kind: "done", tool: "open_contract", ok: 1, failed: ["c"] });
    expect(runAction).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledTimes(1);
  });
});

describe("useListControl: TableView callbacks", () => {
  it("onSortChange re-sorts the rows and is what the tools then report", () => {
    const { hook, handle } = setup();
    expect(shownNames(hook.result.current.rows)).toEqual(["Charlie", "Alice", "Bob"]);
    act(() => {
      hook.result.current.onSortChange({ key: "name", direction: "asc" });
    });
    expect(hook.result.current.sort).toEqual({ key: "name", direction: "asc" });
    expect(shownNames(hook.result.current.rows)).toEqual(["Alice", "Bob", "Charlie"]);
    expect(handle.info().sort).toEqual({ key: "name", direction: "asc" });
    act(() => {
      hook.result.current.onSortChange(undefined);
    });
    expect(hook.result.current.sort).toBeNull();
    expect(shownNames(hook.result.current.rows)).toEqual(["Charlie", "Alice", "Bob"]);
  });

  it("onSelectionChange replaces the selection with the keys TableView hands back", () => {
    const { hook, handle } = setup();
    expect(hook.result.current.rows.map((r) => r[LIST_KEY_FIELD])).toEqual(["a", "b", "c"]);
    act(() => {
      handle.select(["a"]);
    });
    act(() => {
      hook.result.current.onSelectionChange([], ["b", "c"]);
    });
    expect(hook.result.current.selectedKeys).toEqual(["b", "c"]);
    expect(handle.info().selected).toEqual(["b", "c"]);
  });
});
