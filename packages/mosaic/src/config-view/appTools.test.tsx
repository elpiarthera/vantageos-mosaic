import { act, cleanup, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DETAIL_CONFIG, DETAIL_PAYLOAD, LIST_CONFIG } from "../view-config/fixtures";
import type { AppLike } from "./ConfigViewApp";
import { startConfigView } from "./ConfigViewApp";

afterEach(() => {
  cleanup();
  // startConfigView owns its React root: detach it so the next test queries a clean document.
  document.body.innerHTML = "";
});

type ToolDef = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: { type: string; properties?: Record<string, unknown>; required?: string[] };
};
type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

type FakeApp = AppLike & {
  ontoolresult: (p: unknown) => void;
  onlisttools: (p: unknown) => Promise<{ tools: ToolDef[] }>;
  oncalltool: (p: { name: string; arguments?: unknown }) => Promise<ToolResult>;
  callServerTool: ReturnType<typeof vi.fn>;
  updateModelContext: ReturnType<typeof vi.fn>;
};

function fakeApp(opts: { serverResult?: unknown; failAssign?: boolean; noContext?: boolean } = {}) {
  const order: string[] = [];
  const app: Record<string, unknown> = {
    callServerTool: vi.fn(async () => opts.serverResult ?? { structuredContent: {}, _meta: {} }),
    getHostContext: () => ({ locale: "en" }),
    connect: vi.fn(async () => {
      order.push("connect");
    }),
  };
  if (!opts.noContext) app.updateModelContext = vi.fn(async () => ({}));
  for (const prop of ["ontoolresult", "ontoolinput", "onhostcontextchanged"]) {
    let h: unknown;
    Object.defineProperty(app, prop, {
      get: () => h,
      set: (v) => {
        h = v;
      },
    });
  }
  for (const prop of ["onlisttools", "oncalltool"]) {
    let h: unknown;
    Object.defineProperty(app, prop, {
      get: () => h,
      set: (v) => {
        if (opts.failAssign) throw new Error("host has no tools capability");
        order.push(`set:${prop}`);
        h = v;
      },
    });
  }
  return { app: app as unknown as FakeApp, order };
}

const ROWS = [
  { id: "c1", reference: "BAIL-001", kind: "Bail", tenant_name: "Dupont", start: "2024-05-01" },
  { id: "c2", reference: "BAIL-002", kind: "Bail", tenant_name: "Martin", start: "2025-01-15" },
  {
    id: "c3",
    reference: "BAIL-003",
    kind: "Vacant",
    tenant_name: "Émilie Durand",
    start: "2023-03-01",
  },
  { id: "c4", reference: "BAIL-004", kind: "Bail", tenant_name: "Zola", start: "2022-02-02" },
];
const payload = { contracts: ROWS, nextCursor: "cur-2", exhausted: false, truncated: false };
const CONFIG = { ...LIST_CONFIG, paging: undefined } as Record<string, unknown>;
const listResult = (config: unknown = CONFIG) => ({
  structuredContent: payload,
  _meta: { viewConfig: config, locale: "en" },
});
const detailResult = {
  structuredContent: DETAIL_PAYLOAD,
  _meta: { viewConfig: DETAIL_CONFIG, locale: "en" },
};

async function mount(app: FakeApp, result: unknown = listResult()) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  await act(async () => {
    await startConfigView(app, root);
  });
  await act(async () => app.ontoolresult(result));
  return root;
}
async function call(app: FakeApp, name: string, args?: unknown): Promise<ToolResult> {
  let out: ToolResult | undefined;
  await act(async () => {
    out = await app.oncalltool({ name, arguments: args });
  });
  return out as ToolResult;
}
const text = (r: ToolResult) => r.content.map((b) => b.text).join("\n");
const shownRefs = () =>
  screen
    .getAllByRole("row")
    .map((r) => /BAIL-\d+/.exec(r.textContent ?? "")?.[0])
    .filter(Boolean);

describe("app tools: registration", () => {
  it("registers the handlers BEFORE connect and lists the constant tool set", async () => {
    const { app, order } = fakeApp();
    await mount(app);
    expect(order.indexOf("set:onlisttools")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("set:oncalltool")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("set:onlisttools")).toBeLessThan(order.indexOf("connect"));
    expect(order.indexOf("set:oncalltool")).toBeLessThan(order.indexOf("connect"));
    const { tools } = await app.onlisttools({});
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        "list_clear_filter",
        "list_clear_selection",
        "list_describe",
        "list_filter",
        "list_open_selected",
        "list_select",
        "list_sort",
      ].sort(),
    );
    for (const t of tools) {
      expect(t.inputSchema.type).toBe("object");
      expect((t.description ?? "").split("\n")[0]?.length).toBeLessThanOrEqual(200);
      expect(t.title).toBeTruthy();
    }
  });

  it("definitions are identical across views and carry no column values", async () => {
    const { app } = fakeApp();
    await mount(app);
    const onList = JSON.stringify((await app.onlisttools({})).tools);
    await act(async () => app.ontoolresult(detailResult));
    const onDetail = JSON.stringify((await app.onlisttools({})).tools);
    expect(onDetail).toBe(onList);
    for (const column of ["reference", "tenant", "rent"]) expect(onList).not.toContain(column);
  });

  it("an unknown tool name is an error result, not a throw", async () => {
    const { app } = fakeApp();
    await mount(app);
    const r = await call(app, "nope");
    expect(r.isError).toBe(true);
  });
});

describe("app tools: the open list changes in place", () => {
  it("list_sort reorders the rendered rows with no server call", async () => {
    const { app } = fakeApp();
    await mount(app);
    expect(shownRefs()).toEqual(["BAIL-002", "BAIL-001", "BAIL-003", "BAIL-004"]);
    const r = await call(app, "list_sort", { column: "tenant", direction: "desc" });
    expect(shownRefs()).toEqual(["BAIL-004", "BAIL-002", "BAIL-003", "BAIL-001"]);
    expect(r.isError).toBeFalsy();
    expect(text(r)).toMatch(/tenant/);
    expect(text(r)).toMatch(/desc/);
    await call(app, "list_sort", { column: "tenant", direction: "asc" });
    expect(shownRefs()).toEqual(["BAIL-001", "BAIL-003", "BAIL-002", "BAIL-004"]);
    expect(app.callServerTool).not.toHaveBeenCalled();
  });

  it("list_filter narrows rows (case and accent insensitive); clear restores them", async () => {
    const { app } = fakeApp();
    await mount(app);
    const r = await call(app, "list_filter", { column: "tenant", value: "EMILIE" });
    expect(shownRefs()).toEqual(["BAIL-003"]);
    expect(text(r)).toMatch(/1 of 4/);
    await call(app, "list_clear_filter", {});
    expect(shownRefs()).toHaveLength(4);
    expect(app.callServerTool).not.toHaveBeenCalled();
  });

  it("an unknown column is a normal result listing the valid keys", async () => {
    const { app } = fakeApp();
    await mount(app);
    for (const [name, args] of [
      ["list_sort", { column: "nope", direction: "asc" }],
      ["list_filter", { column: "nope", value: "x" }],
    ] as const) {
      const r = await call(app, name, args);
      expect(r.isError).toBeFalsy();
      expect(text(r)).toContain("reference");
      expect(text(r)).toContain("tenant");
    }
    expect(shownRefs()).toHaveLength(4);
  });

  it("list_select shows the selection; list_open_selected runs the declared action per row", async () => {
    const { app } = fakeApp({
      serverResult: { structuredContent: DETAIL_PAYLOAD, _meta: { viewConfig: DETAIL_CONFIG } },
    });
    await mount(app);
    const sel = await call(app, "list_select", { keys: ["c1", "c3"] });
    expect(text(sel)).toMatch(/2/);
    expect((screen.getByRole("checkbox", { name: /BAIL-001/ }) as HTMLInputElement).checked).toBe(
      true,
    );
    expect((screen.getByRole("checkbox", { name: /BAIL-002/ }) as HTMLInputElement).checked).toBe(
      false,
    );
    expect(app.callServerTool).not.toHaveBeenCalled();
    const r = await call(app, "list_open_selected", {});
    expect(app.callServerTool).toHaveBeenCalledTimes(2);
    expect(app.callServerTool).toHaveBeenNthCalledWith(1, {
      name: "get_rental_situation",
      arguments: { lease_id: "c1" },
    });
    expect(app.callServerTool).toHaveBeenNthCalledWith(2, {
      name: "get_rental_situation",
      arguments: { lease_id: "c3" },
    });
    expect(r.isError).toBeFalsy();
    expect(text(r)).toMatch(/get_rental_situation/);
    expect(text(r)).toMatch(/2/);
  });

  it("list_clear_selection empties it; open_selected then asks to select first", async () => {
    const { app } = fakeApp();
    await mount(app);
    await call(app, "list_select", { keys: ["c2"] });
    await call(app, "list_clear_selection", {});
    expect((screen.getByRole("checkbox", { name: /BAIL-002/ }) as HTMLInputElement).checked).toBe(
      false,
    );
    const r = await call(app, "list_open_selected", {});
    expect(r.isError).toBeFalsy();
    expect(text(r)).toMatch(/list_select/);
    expect(app.callServerTool).not.toHaveBeenCalled();
  });

  it("unknown keys are reported, known keys are still selected", async () => {
    const { app } = fakeApp();
    await mount(app);
    const r = await call(app, "list_select", { keys: ["c2", "zzz"] });
    expect(r.isError).toBeFalsy();
    expect(text(r)).toContain("zzz");
    expect((screen.getByRole("checkbox", { name: /BAIL-002/ }) as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it("without a rowKey the keys are the 0-based displayed index", async () => {
    const { app } = fakeApp();
    const { rowKey: _drop, ...noKey } = CONFIG as Record<string, unknown> & { rowKey?: string };
    await mount(app, listResult(noKey));
    await call(app, "list_select", { keys: ["0"] });
    // displayed first row under the default sort (start desc) is BAIL-002
    expect((screen.getByRole("checkbox", { name: /BAIL-002/ }) as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it("several declared row actions: open_selected asks which one, never guesses", async () => {
    const { app } = fakeApp();
    const two = {
      ...CONFIG,
      rowActions: [
        ...(LIST_CONFIG.rowActions as unknown as unknown[]),
        {
          tool: "get_other",
          args: { id: "$row.id" },
          label: { en: "Other", fr: "Autre" },
        },
      ],
    };
    await mount(app, listResult(two));
    await call(app, "list_select", { keys: ["c1"] });
    const r = await call(app, "list_open_selected", {});
    expect(r.isError).toBeFalsy();
    expect(text(r)).toContain("get_rental_situation");
    expect(text(r)).toContain("get_other");
    expect(app.callServerTool).not.toHaveBeenCalled();
    await call(app, "list_open_selected", { action: "get_other" });
    expect(app.callServerTool).toHaveBeenCalledWith({
      name: "get_other",
      arguments: { id: "c1" },
    });
  });

  it("list_describe states title, tool, columns, counts, sort, filter, selection", async () => {
    const { app } = fakeApp();
    await mount(app);
    await call(app, "list_filter", { column: "kind", value: "lease" });
    await call(app, "list_select", { keys: ["c1"] });
    const t = text(await call(app, "list_describe", {}));
    for (const part of [
      "Tenant contracts",
      "list_tenant_contracts",
      "reference",
      "Reference",
      "3 of 4",
      "start",
      "lease",
      "c1",
    ]) {
      expect(t).toContain(part);
    }
  });

  it("pushes the new state as model context after a change", async () => {
    const { app } = fakeApp();
    await mount(app);
    await call(app, "list_sort", { column: "tenant", direction: "asc" });
    expect(app.updateModelContext).toHaveBeenCalled();
    const arg = app.updateModelContext.mock.calls.at(-1)?.[0] as {
      content: Array<{ text: string }>;
    };
    expect(arg.content[0]?.text).toMatch(/tenant/);
  });

  it("survives a host without updateModelContext or with one that rejects", async () => {
    const a = fakeApp({ noContext: true });
    await mount(a.app);
    expect(
      (await call(a.app, "list_sort", { column: "tenant", direction: "asc" })).isError,
    ).toBeFalsy();
    document.body.innerHTML = "";
    const b = fakeApp();
    b.app.updateModelContext.mockRejectedValue(new Error("no"));
    await mount(b.app);
    expect(
      (await call(b.app, "list_sort", { column: "tenant", direction: "asc" })).isError,
    ).toBeFalsy();
  });
});

describe("app tools: no list open", () => {
  it("every list tool answers a normal 'no list open' result on a detail view", async () => {
    const { app } = fakeApp();
    await mount(app, detailResult);
    for (const [name, args] of [
      ["list_sort", { column: "a", direction: "asc" }],
      ["list_filter", { column: "a", value: "x" }],
      ["list_clear_filter", {}],
      ["list_select", { keys: ["a"] }],
      ["list_clear_selection", {}],
      ["list_describe", {}],
      ["list_open_selected", {}],
    ] as const) {
      const r = await call(app, name, args);
      expect(r.isError).toBeFalsy();
      expect(text(r)).toMatch(/no list is open/i);
    }
  });

  it("and before any result has arrived", async () => {
    const { app } = fakeApp();
    const root = document.createElement("div");
    document.body.appendChild(root);
    await act(async () => {
      await startConfigView(app, root);
    });
    const r = await call(app, "list_describe", {});
    expect(text(r)).toMatch(/no list is open/i);
  });
});

describe("app tools: the view never depends on the host calling them", () => {
  it("renders the list untouched when the host never calls a tool", async () => {
    const { app } = fakeApp();
    await mount(app);
    expect(shownRefs()).toEqual(["BAIL-002", "BAIL-001", "BAIL-003", "BAIL-004"]);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(app.updateModelContext).not.toHaveBeenCalled();
  });

  it("renders when the host cannot take tool handlers (assignment throws): no throw at connect", async () => {
    const { app } = fakeApp({ failAssign: true });
    await mount(app);
    expect(shownRefs()).toHaveLength(4);
  });

  it("the real ext-apps App accepts the handlers with the declared capability", async () => {
    const { App } = await import("@modelcontextprotocol/ext-apps");
    // Module path in a variable: a missing module fails THIS test, not the whole file's transform.
    const modulePath = "./appTools";
    const { registerListTools, createListRegistry } = await import(/* @vite-ignore */ modulePath);
    const real = new App({ name: "t", version: "0" }, { tools: { listChanged: true } });
    expect(() => registerListTools(real as never, createListRegistry())).not.toThrow();
    const list = await (
      real.onlisttools as (p: unknown, e: unknown) => Promise<{ tools: unknown[] }>
    )({}, {});
    expect(list.tools).toHaveLength(7);
  });
});
