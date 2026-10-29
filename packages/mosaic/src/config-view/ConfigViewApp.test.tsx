import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { wcagViolations } from "../__tests__/axe";
import { DETAIL_CONFIG, DETAIL_PAYLOAD, LIST_CONFIG, LIST_PAYLOAD } from "../view-config/fixtures";
import { type AppLike, ConfigViewApp, startConfigView } from "./ConfigViewApp";

afterEach(cleanup);

type MockApp = AppLike & {
  ontoolresult: (p: unknown) => void;
  ontoolinput: (p: unknown) => void;
  onhostcontextchanged: (p: unknown) => void;
  callServerTool: ReturnType<typeof vi.fn>;
};
type Handler = (p: unknown) => void;
function mockApp(opts: { locale?: string; callResult?: unknown } = {}) {
  const calls: string[] = [];
  const app = {
    callServerTool: vi.fn(async () => opts.callResult ?? {}),
    getHostContext: () => (opts.locale ? { locale: opts.locale } : undefined),
    connect: vi.fn(async () => {
      calls.push("connect");
    }),
  };
  for (const prop of ["ontoolresult", "ontoolinput", "onhostcontextchanged"]) {
    let h: Handler | undefined;
    Object.defineProperty(app, prop, {
      get: () => h,
      set: (v) => {
        calls.push(`set:${prop}`);
        h = v;
      },
    });
  }
  return { app: app as unknown as MockApp, calls };
}

const listResult = {
  structuredContent: LIST_PAYLOAD,
  _meta: { viewConfig: LIST_CONFIG, locale: "en" },
};
const detailResult = {
  structuredContent: DETAIL_PAYLOAD,
  _meta: { viewConfig: DETAIL_CONFIG, locale: "en" },
};

describe("startConfigView (A-9: ontoolresult before connect)", () => {
  it("registers ontoolresult and ontoolinput BEFORE connect", async () => {
    const { app, calls } = mockApp();
    const root = document.createElement("div");
    document.body.appendChild(root);
    await act(async () => {
      await startConfigView(app, root);
    });
    expect(calls.indexOf("set:ontoolresult")).toBeGreaterThanOrEqual(0);
    expect(calls.indexOf("set:ontoolresult")).toBeLessThan(calls.indexOf("connect"));
    expect(calls.indexOf("set:ontoolinput")).toBeLessThan(calls.indexOf("connect"));
    root.remove();
  });
});

describe("ConfigViewApp switches on _meta.viewConfig.kind", () => {
  it("waits, then renders a list from the first tool result", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    expect(screen.queryAllByText("Waiting for data")).toHaveLength(1);
    await act(async () => app.ontoolresult(listResult));
    expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
    expect(screen.queryAllByRole("table")).toHaveLength(1);
  });

  it("renders a detail for a detail config", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () => app.ontoolresult(detailResult));
    expect(screen.getByRole("heading", { name: "Condominium" })).toBeTruthy();
  });

  it("refuses visibly when the result has no view config", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () => app.ontoolresult({ structuredContent: {} }));
    expect(screen.getByRole("alert").textContent).toContain("View configuration is invalid");
  });

  it("refuses visibly on an invalid view config", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () =>
      app.ontoolresult({ structuredContent: {}, _meta: { viewConfig: { kind: "x" } } }),
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("locale: result _meta first, then the host context, then en", async () => {
    const a = mockApp({ locale: "fr-FR" });
    render(<ConfigViewApp app={a.app} />);
    await act(async () =>
      a.app.ontoolresult({ structuredContent: LIST_PAYLOAD, _meta: { viewConfig: LIST_CONFIG } }),
    );
    expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
    cleanup();
    const b = mockApp({ locale: "fr" });
    render(<ConfigViewApp app={b.app} />);
    await act(async () => b.app.ontoolresult(listResult));
    expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
    cleanup();
    const c = mockApp({ locale: "de" });
    render(<ConfigViewApp app={c.app} />);
    await act(async () =>
      c.app.ontoolresult({ structuredContent: LIST_PAYLOAD, _meta: { viewConfig: LIST_CONFIG } }),
    );
    expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
  });

  it("a host context change updates the locale", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () =>
      app.ontoolresult({ structuredContent: LIST_PAYLOAD, _meta: { viewConfig: LIST_CONFIG } }),
    );
    await act(async () => app.onhostcontextchanged({ locale: "fr-CA" }));
    expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
    await act(async () => app.onhostcontextchanged({ theme: "dark" }));
    expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
  });
});

describe("ConfigViewApp drill-down through the bridge", () => {
  it("a row action calls the tool via app.callServerTool and shows the returned detail, with a way back", async () => {
    const { app } = mockApp({ callResult: detailResult });
    render(<ConfigViewApp app={app} />);
    await act(async () => app.ontoolresult(listResult));
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", { name: /Rental situation/ })[0] as HTMLElement,
      );
    });
    expect(app.callServerTool).toHaveBeenCalledWith({
      name: "get_rental_situation",
      arguments: { lease_id: "c2" },
    });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Condominium" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
  });

  it("paging uses the original tool input captured from ontoolinput", async () => {
    const { app } = mockApp({
      callResult: { structuredContent: { contracts: [], exhausted: true } },
    });
    render(<ConfigViewApp app={app} />);
    await act(async () => app.ontoolinput({ arguments: { q: "dupont" } }));
    await act(async () => app.ontoolresult(listResult));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    });
    expect(app.callServerTool).toHaveBeenCalledWith({
      name: "list_tenant_contracts",
      arguments: { q: "dupont", cursor: "cur-2", limit: 20 },
    });
  });

  it("a new tool result from the host replaces the view and clears the history", async () => {
    const { app } = mockApp({ callResult: detailResult });
    render(<ConfigViewApp app={app} />);
    await act(async () => app.ontoolresult(listResult));
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", { name: /Rental situation/ })[0] as HTMLElement,
      );
    });
    await act(async () => app.ontoolresult(listResult));
    expect(screen.queryAllByRole("button", { name: "Back" })).toHaveLength(0);
  });

  it("axe finds 0 WCAG A/AA violations on the shell (waiting, list, detail)", async () => {
    const { app } = mockApp();
    const { container } = render(<ConfigViewApp app={app} />);
    expect(await wcagViolations(container)).toEqual([]);
    await act(async () => app.ontoolresult(listResult));
    expect(await wcagViolations(container)).toEqual([]);
    await act(async () => app.ontoolresult(detailResult));
    expect(await wcagViolations(container)).toEqual([]);
  });
});

describe("sandbox hygiene of the authored view source (A-2, A-3)", () => {
  const dir = import.meta.dirname;
  const files = readdirSync(dir)
    .filter((f) => /\.(tsx?|css|html)$/.test(f) && !f.endsWith(".test.tsx"))
    .map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("scans real files (positive control)", () => {
    expect(files.map(([f]) => f)).toContain("ConfigViewApp.tsx");
  });

  for (const [needle, why] of [
    ["window.parent", "A-3 sandbox"],
    ["localStorage", "A-3 sandbox"],
    ["sessionStorage", "A-3 sandbox"],
    ["fetch(", "A-2 no network"],
    ["XMLHttpRequest", "A-2 no network"],
    ["WebSocket", "A-2 no network"],
    ["eval(", "CSP"],
  ] as const) {
    it(`no ${needle} (${why})`, () => {
      const hits = files.filter(([, src]) => src.includes(needle)).map(([f]) => f);
      expect(hits).toEqual([]);
    });
  }
});
