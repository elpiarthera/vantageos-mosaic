import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { wcagViolations } from "../../__tests__/axe";
import { REMOVE, mutated } from "../../__tests__/mutate";
import { DETAIL_CONFIG, DETAIL_PAYLOAD } from "../../view-config/fixtures";
import type { ConfigViewBridge } from "../../view-config/view-config";
import { ConfigDetail } from "./ConfigDetail";

afterEach(cleanup);
function bridge(result: unknown): ConfigViewBridge & { callServerTool: ReturnType<typeof vi.fn> } {
  return { callServerTool: vi.fn(async () => result) } as never;
}

describe("ConfigDetail renders a detail from a section E config", () => {
  it("renders sections, labelled fields with formats, and the nested table", () => {
    render(<ConfigDetail config={DETAIL_CONFIG} payload={DETAIL_PAYLOAD} />);
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Condominium",
      "Identity",
      "Figures",
      "Mandate",
      "Lots",
    ]);
    const dt = Array.from(document.querySelectorAll("dt")).map((e) => e.textContent);
    expect(dt).toContain("Treasury balance");
    const dd = Array.from(document.querySelectorAll("dd")).map((e) => e.textContent);
    expect(dd).toContain("Résidence des Lilas");
    expect(dd).toContain("75020");
    expect(dd).toContain("42");
    expect(dd).toContain("€15,234.80"); // money from a decimal string
    expect(dd).toContain("87.5%"); // percent
    expect(dd).toContain("Jan 1, 2023"); // nested date path
    const table = screen.getByRole("table", { name: "Lots" });
    expect(within(table).queryAllByText("54.2")).toHaveLength(1);
    expect(within(table).queryAllByText("—")).toHaveLength(1);
  });

  it("takes labels from the config in FR", () => {
    render(<ConfigDetail config={DETAIL_CONFIG} payload={DETAIL_PAYLOAD} locale="fr" />);
    expect(screen.getByRole("heading", { name: "Copropriété" })).toBeTruthy();
    expect(screen.queryAllByText("Solde de trésorerie")).toHaveLength(1);
  });

  it("an empty array shows the empty message", () => {
    render(<ConfigDetail config={DETAIL_CONFIG} payload={{ condominiums: [] }} />);
    expect(screen.queryAllByText("No record to display")).toHaveLength(1);
  });

  it("a single object at dataPath is a record too", () => {
    render(
      <ConfigDetail
        config={DETAIL_CONFIG}
        payload={{ condominiums: DETAIL_PAYLOAD.condominiums[0] }}
      />,
    );
    expect(screen.queryAllByText("Résidence des Lilas")).toHaveLength(1);
  });

  it("several records show a chooser first, then the chosen record with a way back", () => {
    const two = {
      condominiums: [
        { id: "k1", title: "One", lots_listed: [] },
        { id: "k2", title: "Two", lots_listed: [] },
      ],
    };
    render(<ConfigDetail config={DETAIL_CONFIG} payload={two} />);
    expect(screen.queryAllByText("Choose a record")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Two" }));
    expect(screen.queryAllByText("Choose a record")).toHaveLength(0);
    expect(screen.queryAllByText("Two").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryAllByText("Choose a record")).toHaveLength(1);
  });

  it("a chooser entry without a first field falls back to 'Record n'", () => {
    const c = mutated(DETAIL_CONFIG, "sections", [DETAIL_CONFIG.sections[3]]); // table-only section
    render(<ConfigDetail config={c} payload={{ condominiums: [{}, {}] }} />);
    expect(screen.queryAllByRole("button", { name: "Record 2" })).toHaveLength(1);
  });
});

describe("ConfigDetail refuses visibly", () => {
  it("an invalid config renders an alert", () => {
    const c = mutated(DETAIL_CONFIG, "sections", REMOVE);
    render(<ConfigDetail config={c} payload={DETAIL_PAYLOAD} />);
    expect(screen.getByRole("alert").textContent).toContain("View configuration is invalid");
  });
  it("a list config handed to the detail is refused", () => {
    render(
      <ConfigDetail config={mutated(DETAIL_CONFIG, "kind", "list")} payload={DETAIL_PAYLOAD} />,
    );
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });
  it("a payload without data at dataPath renders a data alert", () => {
    render(<ConfigDetail config={DETAIL_CONFIG} payload={{}} />);
    expect(screen.getByRole("alert").textContent).toContain("does not match");
  });
  it("a record whose table path is not a list renders a data alert", () => {
    render(
      <ConfigDetail
        config={DETAIL_CONFIG}
        payload={{ condominiums: [{ id: "k", lots_listed: "oops" }] }}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("does not match");
  });
  it("an absent table path is an empty table, not a refusal", () => {
    render(<ConfigDetail config={DETAIL_CONFIG} payload={{ condominiums: [{ id: "k" }] }} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });
});

describe("ConfigDetail actions use the bridge", () => {
  it("an enabled action calls its tool with $. values from the record", async () => {
    const result = { structuredContent: {} };
    const b = bridge(result);
    const onResult = vi.fn();
    render(
      <ConfigDetail
        config={DETAIL_CONFIG}
        payload={DETAIL_PAYLOAD}
        bridge={b}
        onResult={onResult}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Co-owners" }));
    });
    expect(b.callServerTool).toHaveBeenCalledWith({
      name: "list_co_owners",
      arguments: { condominium_id: "k1" },
    });
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it("the action marked disabled in the config renders disabled", () => {
    const b = bridge({});
    render(<ConfigDetail config={DETAIL_CONFIG} payload={DETAIL_PAYLOAD} bridge={b} />);
    const btn = screen.getByRole("button", { name: "Syndic mandates" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(b.callServerTool).not.toHaveBeenCalled();
  });

  it("a failing tool shows an alert", async () => {
    const b = bridge({ isError: true, content: [{ type: "text", text: "denied" }] });
    render(<ConfigDetail config={DETAIL_CONFIG} payload={DETAIL_PAYLOAD} bridge={b} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Co-owners" }));
    });
    expect(screen.getByRole("alert").textContent).toContain("denied");
  });

  it("an unresolvable argument is refused, not sent", async () => {
    const b = bridge({});
    render(
      <ConfigDetail
        config={DETAIL_CONFIG}
        payload={{ condominiums: [{ title: "x" }] }}
        bridge={b}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Co-owners" }));
    });
    expect(b.callServerTool).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("$.id");
  });
});

describe("ConfigDetail accessibility", () => {
  it("axe finds 0 WCAG A/AA violations", async () => {
    const { container } = render(
      <ConfigDetail
        config={DETAIL_CONFIG}
        payload={DETAIL_PAYLOAD}
        bridge={bridge({})}
        locale="fr"
      />,
    );
    expect(await wcagViolations(container)).toEqual([]);
  });
  it("axe finds 0 violations on the chooser and the refusal", async () => {
    const two = {
      condominiums: [
        { id: "a", title: "A" },
        { id: "b", title: "B" },
      ],
    };
    const chooser = render(<ConfigDetail config={DETAIL_CONFIG} payload={two} />);
    expect(await wcagViolations(chooser.container)).toEqual([]);
    chooser.unmount();
    const refused = render(<ConfigDetail config={{}} payload={{}} />);
    expect(await wcagViolations(refused.container)).toEqual([]);
  });
});
