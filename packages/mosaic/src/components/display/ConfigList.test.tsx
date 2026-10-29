import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { wcagViolations } from "../../__tests__/axe";
import { REMOVE, mutated } from "../../__tests__/mutate";
import { LIST_CONFIG, LIST_PAYLOAD } from "../../view-config/fixtures";
import type { ConfigViewBridge } from "../../view-config/view-config";
import { ConfigList } from "./ConfigList";

afterEach(cleanup);

function bridge(result: unknown): ConfigViewBridge & { callServerTool: ReturnType<typeof vi.fn> } {
  return { callServerTool: vi.fn(async () => result) } as never;
}

describe("ConfigList renders a list from a section E config", () => {
  it("shows the title, FR/EN column labels and the formatted cells", () => {
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} locale="en" />);
    expect(screen.getByRole("heading", { name: "Tenant contracts" })).toBeTruthy();
    for (const h of [
      "Reference",
      "Type",
      "Tenant",
      "Lots",
      "Start",
      "End",
      "Rent incl. VAT",
      "Signed",
    ]) {
      expect(screen.queryAllByRole("columnheader", { name: new RegExp(h) }).length).toBeGreaterThan(
        0,
      );
    }
    expect(screen.queryAllByText("Lease")).toHaveLength(1); // enum label
    expect(screen.queryAllByText("A1, B2")).toHaveLength(1); // join
    expect(screen.queryAllByText("May 1, 2024")).toHaveLength(1); // date
    expect(screen.queryAllByText("€1,234.50")).toHaveLength(1); // money
    expect(screen.queryAllByText("Yes")).toHaveLength(1); // boolean
    expect(screen.queryAllByText("No")).toHaveLength(1);
  });

  it("takes every label from the config in FR", () => {
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} locale="fr" />);
    expect(screen.getByRole("heading", { name: "Contrats locataires" })).toBeTruthy();
    expect(screen.queryAllByRole("columnheader", { name: /Loyer TTC/ }).length).toBe(1);
    expect(screen.queryAllByText("Oui")).toHaveLength(1);
    expect(screen.queryAllByRole("button", { name: /Situation locative/ }).length).toBe(2);
  });

  it("applies defaultSort (start desc: 2025 before 2024)", () => {
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0] as HTMLElement).queryAllByText("BAIL-002")).toHaveLength(1);
  });

  it("shows the configured empty message when there are no rows", () => {
    render(<ConfigList config={LIST_CONFIG} payload={{ contracts: [] }} locale="fr" />);
    expect(screen.queryAllByText("Aucun contrat ne correspond à ces filtres.")).toHaveLength(1);
  });

  it("falls back to the library empty message when the config has none", () => {
    const c = mutated(LIST_CONFIG, "emptyMessage", REMOVE);
    render(<ConfigList config={c} payload={{ contracts: [] }} />);
    expect(screen.queryAllByText("No data to display")).toHaveLength(1);
  });
});

describe("ConfigList refuses visibly, never defaults silently", () => {
  it("an invalid config renders an alert naming the problem and no table", () => {
    const c = mutated(LIST_CONFIG, "columns", REMOVE);
    render(<ConfigList config={c} payload={LIST_PAYLOAD} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("View configuration is invalid");
    expect(alert.textContent).toMatch(/columns/);
    expect(screen.queryAllByRole("table")).toHaveLength(0);
  });

  it("the refusal is localised (FR)", () => {
    render(<ConfigList config={{}} payload={{}} locale="fr" />);
    expect(screen.getByRole("alert").textContent).toContain(
      "La configuration de la vue est invalide",
    );
  });

  it("a detail config handed to the list is refused", () => {
    render(<ConfigList config={mutated(LIST_CONFIG, "kind", "detail")} payload={LIST_PAYLOAD} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });

  it("a payload without rows at dataPath renders a data alert", () => {
    render(<ConfigList config={LIST_CONFIG} payload={{ other: [] }} />);
    expect(screen.getByRole("alert").textContent).toContain("does not match");
  });
});

describe("ConfigList paging and row actions use the bridge", () => {
  it("'Load more' calls the same tool with the cursor, the limit and the original args, and appends rows", async () => {
    const b = bridge({
      structuredContent: {
        contracts: [{ id: "c3", reference: "BAIL-003", start: "2023-01-01", rent_ttc: 5 }],
        nextCursor: null,
        exhausted: true,
        truncated: false,
      },
    });
    render(
      <ConfigList
        config={LIST_CONFIG}
        payload={LIST_PAYLOAD}
        bridge={b}
        toolArgs={{ q: "dupont" }}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    });
    expect(b.callServerTool).toHaveBeenCalledTimes(1);
    expect(b.callServerTool).toHaveBeenCalledWith({
      name: "list_tenant_contracts",
      arguments: { q: "dupont", cursor: "cur-2", limit: 20 },
    });
    await waitFor(() => expect(screen.queryAllByText("BAIL-003")).toHaveLength(1));
    expect(screen.queryAllByText("BAIL-001")).toHaveLength(1);
    expect(screen.queryAllByRole("button", { name: "Load more" })).toHaveLength(0);
  });

  it("no 'Load more' when the page is exhausted or has no cursor", () => {
    const { rerender } = render(
      <ConfigList
        config={LIST_CONFIG}
        payload={{ ...LIST_PAYLOAD, exhausted: true }}
        bridge={bridge({})}
      />,
    );
    expect(screen.queryAllByRole("button", { name: "Load more" })).toHaveLength(0);
    rerender(
      <ConfigList
        config={LIST_CONFIG}
        payload={{ ...LIST_PAYLOAD, nextCursor: null }}
        bridge={bridge({})}
      />,
    );
    expect(screen.queryAllByRole("button", { name: "Load more" })).toHaveLength(0);
  });

  it("'Load more' is labelled in FR and shows a truncation notice", () => {
    render(
      <ConfigList
        config={LIST_CONFIG}
        payload={{ ...LIST_PAYLOAD, truncated: true }}
        bridge={bridge({})}
        locale="fr"
      />,
    );
    expect(screen.queryAllByRole("button", { name: "Voir la suite" })).toHaveLength(1);
    expect(screen.queryAllByText("Les résultats sont tronqués")).toHaveLength(1);
  });

  it("a failing paging call shows an alert and keeps the rows", async () => {
    const b = bridge({ isError: true, content: [{ type: "text", text: "rate limited" }] });
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={b} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    });
    expect(screen.getByRole("alert").textContent).toContain("rate limited");
    expect(screen.queryAllByText("BAIL-001")).toHaveLength(1);
  });

  it("a paging call that throws shows an alert", async () => {
    const b: ConfigViewBridge = {
      callServerTool: vi.fn(async () => {
        throw new Error("offline");
      }),
    };
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={b} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    });
    expect(screen.getByRole("alert").textContent).toContain("offline");
  });

  it("a paging result without rows at dataPath shows a data alert", async () => {
    const b = bridge({ structuredContent: { nope: 1 } });
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={b} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    });
    expect(screen.getByRole("alert").textContent).toContain("does not match");
  });

  it("the row action calls the detail tool named in the config with the row's values", async () => {
    const result = { structuredContent: { x: 1 }, _meta: { viewConfig: {} } };
    const b = bridge(result);
    const onResult = vi.fn();
    render(
      <ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={b} onResult={onResult} />,
    );
    const buttons = screen.getAllByRole("button", { name: /Rental situation/ });
    expect(buttons).toHaveLength(2);
    // sorted start desc: first row is c2
    await act(async () => {
      fireEvent.click(buttons[0] as HTMLElement);
    });
    expect(b.callServerTool).toHaveBeenCalledWith({
      name: "get_rental_situation",
      arguments: { lease_id: "c2" },
    });
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it("each action button names its row for assistive tech", () => {
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={bridge({})} />);
    expect(screen.queryAllByRole("button", { name: "Rental situation: BAIL-001" })).toHaveLength(1);
  });

  it("an action marked disabled in the config renders disabled and never calls the bridge", () => {
    const c = mutated(LIST_CONFIG, "rowActions.0.disabled", true);
    const b = bridge({});
    render(<ConfigList config={c} payload={LIST_PAYLOAD} bridge={b} />);
    const buttons = screen.getAllByRole("button", { name: /Rental situation/ });
    for (const btn of buttons) {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(btn);
    }
    expect(b.callServerTool).not.toHaveBeenCalled();
  });

  it("actions are disabled when no bridge is available", () => {
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} />);
    for (const btn of screen.getAllByRole("button", { name: /Rental situation/ })) {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it("an action whose `when` path is null on a row is not offered for that row", () => {
    const c = mutated(LIST_CONFIG, "rowActions.0.when", "end");
    render(<ConfigList config={c} payload={LIST_PAYLOAD} bridge={bridge({})} />);
    expect(screen.queryAllByRole("button", { name: /Rental situation/ })).toHaveLength(1);
  });

  it("an action whose argument cannot be resolved is refused with an alert, not sent", async () => {
    const c = mutated(LIST_CONFIG, "rowActions.0.args.lease_id", "$row.missing");
    const b = bridge({});
    render(<ConfigList config={c} payload={LIST_PAYLOAD} bridge={b} />);
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", { name: /Rental situation/ })[0] as HTMLElement,
      );
    });
    expect(b.callServerTool).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("$row.missing");
  });

  it("a row action whose tool errors shows the tool's message", async () => {
    const b = bridge({ isError: true, content: [{ type: "text", text: "not found" }] });
    render(<ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={b} />);
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", { name: /Rental situation/ })[0] as HTMLElement,
      );
    });
    expect(screen.getByRole("alert").textContent).toContain("not found");
  });
});

describe("ConfigList totals", () => {
  const cfg = {
    ...LIST_CONFIG,
    totals: [
      {
        path: "total_rent",
        label: { en: "Total rent", fr: "Loyer total" },
        format: { type: "money", currency: "EUR" },
      },
    ],
    totalsScope: { scopePath: "scope", completePath: "complete", notePath: "note" },
  };

  it("shows the totals with their scope and flags an incomplete total", () => {
    render(
      <ConfigList
        config={cfg}
        payload={{
          ...LIST_PAYLOAD,
          total_rent: 2034.5,
          scope: "visible page",
          complete: false,
          note: "page 1 only",
        }}
      />,
    );
    expect(screen.queryAllByText("Total rent")).toHaveLength(1);
    expect(screen.queryAllByText("€2,034.50")).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toContain("Totals are incomplete");
    expect(screen.getByRole("status").textContent).toContain("page 1 only");
    expect(screen.getByRole("status").textContent).toContain("visible page");
  });

  it("a complete total shows no warning", () => {
    render(
      <ConfigList config={cfg} payload={{ ...LIST_PAYLOAD, total_rent: 1, complete: true }} />,
    );
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });
});

describe("ConfigList accessibility", () => {
  it("axe finds 0 WCAG A/AA violations", async () => {
    const { container } = render(
      <ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={bridge({})} locale="fr" />,
    );
    expect(await wcagViolations(container)).toEqual([]);
  });
  it("axe finds 0 violations on the refusal state too", async () => {
    const { container } = render(<ConfigList config={{}} payload={{}} />);
    expect(await wcagViolations(container)).toEqual([]);
  });
});
