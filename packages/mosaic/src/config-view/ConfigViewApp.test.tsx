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

  // The host knows the person's language; a server that cannot see it (no locale header from the host)
  // echoes its default "en". Measured live: Lojii in claude.ai for a French user rendered English headers.
  it("locale: the host context first, then the result _meta, then en", async () => {
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
    expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
    cleanup();
    const e = mockApp();
    render(<ConfigViewApp app={e.app} />);
    await act(async () =>
      e.app.ontoolresult({
        structuredContent: LIST_PAYLOAD,
        _meta: { viewConfig: LIST_CONFIG, locale: "fr" },
      }),
    );
    expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
    cleanup();
    const c = mockApp({ locale: "de" });
    render(<ConfigViewApp app={c.app} />);
    await act(async () =>
      c.app.ontoolresult({ structuredContent: LIST_PAYLOAD, _meta: { viewConfig: LIST_CONFIG } }),
    );
    expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
  });

  // A client deployment holds its staff's language as data: the server may opt in to be authoritative.
  describe("locale authority (_meta.localeAuthority)", () => {
    const AUTH_PAYLOAD = {
      ...LIST_PAYLOAD,
      contracts: [{ ...LIST_PAYLOAD.contracts[0], end: "2026-12-31", rent_ttc: 70852.72 }],
    };
    const result = (meta: Record<string, unknown>) => ({
      structuredContent: AUTH_PAYLOAD,
      _meta: { viewConfig: LIST_CONFIG, ...meta },
    });

    it("server authority: _meta.locale fr beats an English host (labels, date, number)", async () => {
      const { app } = mockApp({ locale: "en-US" });
      render(<ConfigViewApp app={app} />);
      await act(async () => app.ontoolresult(result({ locale: "fr", localeAuthority: "server" })));
      expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
      expect(document.body.textContent).toContain("31/12/2026");
      expect(document.body.textContent).toContain("70\u202f852,72");
    });

    it("server authority: _meta.locale en beats a French host", async () => {
      const { app } = mockApp({ locale: "fr-FR" });
      render(<ConfigViewApp app={app} />);
      await act(async () => app.ontoolresult(result({ locale: "en", localeAuthority: "server" })));
      expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
    });

    it("no authority: the host stays first (default unchanged)", async () => {
      const { app } = mockApp({ locale: "en-US" });
      render(<ConfigViewApp app={app} />);
      await act(async () => app.ontoolresult(result({ locale: "fr" })));
      expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
    });

    it("authority 'host' and unknown values behave as the default", async () => {
      for (const authority of ["host", "bogus"]) {
        const { app } = mockApp({ locale: "en-US" });
        render(<ConfigViewApp app={app} />);
        await act(async () =>
          app.ontoolresult(result({ locale: "fr", localeAuthority: authority })),
        );
        expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
        cleanup();
      }
    });

    it("server authority without a valid _meta.locale falls back to the host locale", async () => {
      for (const meta of [{}, { locale: "de" }]) {
        const { app } = mockApp({ locale: "fr-FR" });
        render(<ConfigViewApp app={app} />);
        await act(async () => app.ontoolresult(result({ ...meta, localeAuthority: "server" })));
        expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
        cleanup();
      }
    });
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

  describe("Load more resends the args of the list it pages (every list in the history)", () => {
    const pagedConfig = {
      ...LIST_CONFIG,
      tool: "list_lots",
      rowActions: [],
    };
    const pagedResult = {
      structuredContent: { contracts: LIST_PAYLOAD.contracts.slice(0, 1), nextCursor: "cur-9" },
      _meta: { viewConfig: pagedConfig, locale: "en" },
    };
    const lastPage = { structuredContent: { contracts: [], exhausted: true } };

    it("a list reached by a row action pages with that action's tool + args + cursor", async () => {
      const { app } = mockApp();
      app.callServerTool.mockResolvedValueOnce(pagedResult).mockResolvedValueOnce(lastPage);
      render(<ConfigViewApp app={app} />);
      await act(async () => app.ontoolinput({ arguments: { q: "dupont" } }));
      await act(async () => app.ontoolresult(listResult));
      await act(async () => {
        fireEvent.click(
          screen.getAllByRole("button", { name: /Rental situation/ })[0] as HTMLElement,
        );
      });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Load more" }));
      });
      expect(app.callServerTool).toHaveBeenLastCalledWith({
        name: "list_lots",
        arguments: { lease_id: "c2", cursor: "cur-9", limit: 20 },
      });
    });

    it("ontoolinput arriving AFTER the result still feeds Load more", async () => {
      const { app } = mockApp({
        callResult: { structuredContent: { contracts: [], exhausted: true } },
      });
      render(<ConfigViewApp app={app} />);
      await act(async () => app.ontoolresult(listResult));
      await act(async () => app.ontoolinput({ arguments: { q: "dupont" } }));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Load more" }));
      });
      expect(app.callServerTool).toHaveBeenCalledWith({
        name: "list_tenant_contracts",
        arguments: { q: "dupont", cursor: "cur-2", limit: 20 },
      });
    });

    it("a refused page restarts the list without the cursor, with a localized notice and no raw error", async () => {
      const { app } = mockApp({ locale: "fr" });
      app.callServerTool
        .mockResolvedValueOnce({
          isError: true,
          content: [{ type: "text", text: "invalid_cursor: RAW-TOOL-ERROR" }],
        })
        .mockResolvedValueOnce({
          structuredContent: { contracts: [LIST_PAYLOAD.contracts[0]], nextCursor: "cur-fresh" },
        });
      render(<ConfigViewApp app={app} />);
      await act(async () => app.ontoolinput({ arguments: { q: "dupont" } }));
      await act(async () => app.ontoolresult(listResult));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Voir la suite" }));
      });
      expect(app.callServerTool).toHaveBeenCalledTimes(2);
      expect(app.callServerTool).toHaveBeenLastCalledWith({
        name: "list_tenant_contracts",
        arguments: { q: "dupont" },
      });
      expect(screen.getByText("La liste a été rechargée depuis le début.")).toBeTruthy();
      expect(document.body.textContent).not.toContain("RAW-TOOL-ERROR");
      expect(screen.getAllByRole("row")).toHaveLength(2);
    });

    it("a failed restart shows the localized error, never the raw text", async () => {
      const { app } = mockApp({ locale: "en" });
      app.callServerTool.mockResolvedValue({
        isError: true,
        content: [{ type: "text", text: "RAW-TOOL-ERROR" }],
      });
      render(<ConfigViewApp app={app} />);
      await act(async () => app.ontoolresult(listResult));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Load more" }));
      });
      expect(screen.getByRole("alert").textContent).toBe("The tool call failed");
      expect(document.body.textContent).not.toContain("RAW-TOOL-ERROR");
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

describe("theme and design (operator: the view looked plain)", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });
  it("the host theme is applied to the document, and follows a host context change", async () => {
    const { app } = mockApp();
    (app as unknown as { getHostContext: () => unknown }).getHostContext = () => ({
      theme: "dark",
    });
    const root = document.createElement("div");
    document.body.appendChild(root);
    await act(async () => {
      await startConfigView(app, root);
    });
    expect(document.documentElement.dataset.theme).toBe("dark");
    await act(async () => app.onhostcontextchanged({ theme: "light" }));
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  const css = readFileSync(join(import.meta.dirname, "config-view.css"), "utf8");
  it("the stylesheet carries the mosaic tokens (light and dark) into the single file", () => {
    expect(css).toMatch(/@import\s+["']@vantageos\/mosaic-tokens\/css["']/);
  });
  it.each([
    ["the table header", /\bth\b[^{]*\{[^}]*var\(--mosaic-color-muted/],
    ["row separators", /\btd\b[^{]*\{[^}]*border-bottom:[^;]*var\(--mosaic-color-border/],
    ["the text colour", /var\(--mosaic-color-foreground/],
    ["the table frame radius", /var\(--mosaic-radius-/],
    ["row hover", /tr:hover[^{]*\{[^}]*var\(--mosaic-color-/],
    ["the font", /var\(--mosaic-font-sans/],
  ])("%s is drawn from a mosaic token", (_part, rx) => {
    expect(css).toMatch(rx);
  });
  it("a narrow viewport keeps the table readable (horizontal scroll inside the frame, never the page)", () => {
    expect(css).toMatch(/\.mosaic-table-frame\s*\{[^}]*overflow-x:\s*auto/);
  });
});

describe("per-deployment theme (_meta.theme)", () => {
  const styleEls = () => document.head.querySelectorAll("style[data-mosaic-theme]");
  const themed = (theme: unknown) => ({ ...listResult, _meta: { ...listResult._meta, theme } });
  afterEach(() => {
    for (const el of styleEls()) el.remove();
    vi.restoreAllMocks();
  });

  it("writes ONE style element with the light custom properties and a dark block", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () =>
      app.ontoolresult(
        themed({
          schemaVersion: 1,
          light: { "--mosaic-radius-md": "9px" },
          dark: { "--mosaic-color-accent": "#112233" },
        }),
      ),
    );
    expect(styleEls()).toHaveLength(1);
    const css = styleEls()[0]?.textContent;
    expect(css).toContain(":root{--mosaic-radius-md:9px;}");
    expect(css).toContain('[data-theme="dark"]{--mosaic-color-accent:#112233;}');
  });

  it("a second result with another theme replaces it, never accumulates", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () =>
      app.ontoolresult(themed({ schemaVersion: 1, light: { "--mosaic-radius-md": "9px" } })),
    );
    await act(async () =>
      app.ontoolresult(themed({ schemaVersion: 1, light: { "--mosaic-radius-md": "2px" } })),
    );
    expect(styleEls()).toHaveLength(1);
    expect(styleEls()[0]?.textContent).toContain("2px");
    expect(styleEls()[0]?.textContent).not.toContain("9px");
  });

  it("a result without a theme removes the element (default look)", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () =>
      app.ontoolresult(themed({ schemaVersion: 1, light: { "--mosaic-radius-md": "9px" } })),
    );
    await act(async () => app.ontoolresult(listResult));
    expect(styleEls()).toHaveLength(0);
  });

  it("no theme at all: nothing is written to the head", async () => {
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () => app.ontoolresult(listResult));
    expect(styleEls()).toHaveLength(0);
  });

  it("an invalid theme applies nothing, logs the bad token, shows nothing raw", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { app } = mockApp();
    const { container } = render(<ConfigViewApp app={app} />);
    await act(async () =>
      app.ontoolresult(
        themed({
          schemaVersion: 1,
          light: { "--mosaic-color-nope": "red;x", "--mosaic-radius-md": "1px" },
        }),
      ),
    );
    expect(styleEls()).toHaveLength(0);
    expect(err.mock.calls.flat().join(" ")).toContain("--mosaic-color-nope");
    expect(container.textContent).not.toContain("--mosaic-color-nope");
    expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
  });

  it("an invalid theme after a valid one removes the previous theme (default tokens)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { app } = mockApp();
    render(<ConfigViewApp app={app} />);
    await act(async () =>
      app.ontoolresult(themed({ schemaVersion: 1, light: { "--mosaic-radius-md": "9px" } })),
    );
    await act(async () => app.ontoolresult(themed({ schemaVersion: 1, light: { "--x": "1" } })));
    expect(styleEls()).toHaveLength(0);
  });
});
