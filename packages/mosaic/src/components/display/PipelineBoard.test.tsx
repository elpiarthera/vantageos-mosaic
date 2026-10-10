import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PipelineBoard } from "./PipelineBoard";
import { SUMMARY_STAGE_LIMIT, layoutForDisplayMode, stageSummary } from "./PipelineBoard.logic";
import { pipelineBoardToMarkdown } from "./PipelineBoard.markdown";
import { PipelineBoardPropsSchema } from "./PipelineBoard.schema";

afterEach(cleanup);

// R06: deals by stage, READ-ONLY, fullscreen-first. Claude: fullscreen only for the board
// (inline = stage totals, 4-5 data points). ChatGPT: "ChatGPT uses fullscreen for all
// entrypoints" and the server MUST accept {} -> empty-args default.
const stages = [
  {
    id: "lead",
    name: "Lead",
    deals: [
      { id: "d1", title: "Acme", amount: "0.1", contact: "Ann" },
      { id: "d2", title: "Globex", amount: "0.2" },
    ],
  },
  { id: "won", name: "Won", deals: [{ id: "d3", title: "Initech", amount: "1000.50" }] },
  { id: "lost", name: "Lost", deals: [] },
];

describe("PipelineBoard logic", () => {
  it("fullscreen shows the board; inline and pip fall back to the summary", () => {
    expect(layoutForDisplayMode("fullscreen")).toBe("board");
    expect(layoutForDisplayMode("inline")).toBe("summary");
    expect(layoutForDisplayMode("pip")).toBe("summary");
  });

  it("sums stage amounts exactly (0.1 + 0.2 = 0.3) and counts deals", () => {
    expect(stageSummary(stages[0]?.deals ?? [])).toEqual({ count: 2, total: "0.3" });
    expect(stageSummary([])).toEqual({ count: 0, total: "0" });
  });

  it("ignores deals with no amount but reports undefined when an amount is not a decimal", () => {
    expect(stageSummary([{ amount: "5" }, {}])).toEqual({ count: 2, total: "5" });
    expect(stageSummary([{ amount: "5" }, { amount: "abc" }]).total).toBeUndefined();
  });

  it("caps the inline summary at the Claude 4-5 data-point guideline", () => {
    expect(SUMMARY_STAGE_LIMIT).toBe(5);
  });
});

describe("PipelineBoard board layout (R06)", () => {
  it("renders one labelled column per stage with its deals, count and exact total", () => {
    render(<PipelineBoard stages={stages} currency="EUR" />);
    const lead = screen.getAllByRole("region", { name: "Lead" })[0] as HTMLElement;
    expect(within(lead).queryAllByText("Acme")).toHaveLength(1);
    expect(within(lead).queryAllByText("2 deals")).toHaveLength(1);
    expect(within(lead).queryAllByText("€0.30")).toHaveLength(1);
    const won = screen.getAllByRole("region", { name: "Won" })[0] as HTMLElement;
    expect(within(won).queryAllByText("1 deal")).toHaveLength(1);
    // the stage total and its single deal carry the same amount
    expect(within(won).queryAllByText("€1,000.50")).toHaveLength(2);
    expect(
      within(screen.getAllByRole("region", { name: "Lost" })[0] as HTMLElement).queryAllByText(
        "No deals",
      ),
    ).toHaveLength(1);
  });

  it("is read-only: no drag handles and no stage-change controls", () => {
    render(<PipelineBoard stages={stages} />);
    expect(document.querySelectorAll("[draggable]")).toHaveLength(0);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.queryAllByRole("listbox")).toHaveLength(0);
  });

  it("filters visible stages with toggle chips (R25) and keeps at least one stage", () => {
    render(<PipelineBoard stages={stages} />);
    const lead = screen.getAllByRole("button", { name: "Lead", pressed: true })[0] as HTMLElement;
    fireEvent.click(lead);
    expect(screen.queryAllByRole("region", { name: "Lead" })).toHaveLength(0);
    expect(screen.queryAllByRole("region", { name: "Won" })).toHaveLength(1);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Won", pressed: true })[0] as HTMLElement,
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Lost", pressed: true })[0] as HTMLElement,
    );
    expect(screen.queryAllByRole("region", { name: "Lost" })).toHaveLength(1);
  });

  it("shows a deal link through onOpenLink only for http(s) urls", () => {
    const onOpenLink = vi.fn();
    render(
      <PipelineBoard
        stages={[
          {
            id: "s",
            name: "S",
            deals: [
              { id: "a", title: "Good", url: "https://crm.example/d/a" },
              { id: "b", title: "Bad", url: "javascript:alert(1)" },
            ],
          },
        ]}
        onOpenLink={onOpenLink}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Good" })[0] as HTMLElement);
    expect(onOpenLink).toHaveBeenCalledWith("https://crm.example/d/a");
    expect(screen.queryAllByRole("button", { name: "Bad" })).toHaveLength(0);
  });
});

describe("PipelineBoard summary layout (inline)", () => {
  it("shows stage totals only, and an Open full board action when fullscreen is requestable", () => {
    const onRequestFullscreen = vi.fn();
    render(
      <PipelineBoard stages={stages} layout="summary" onRequestFullscreen={onRequestFullscreen} />,
    );
    expect(screen.queryAllByText("Acme")).toHaveLength(0);
    expect(screen.queryAllByText("2 deals")).toHaveLength(1);
    fireEvent.click(screen.getAllByRole("button", { name: "Open full board" })[0] as HTMLElement);
    expect(onRequestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("has no Open full board action without a handler", () => {
    render(<PipelineBoard stages={stages} layout="summary" />);
    expect(screen.queryAllByRole("button", { name: "Open full board" })).toHaveLength(0);
  });

  it("names the stages beyond the inline limit instead of rendering them", () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      id: `s${i}`,
      name: `Stage ${i}`,
      deals: [],
    }));
    render(<PipelineBoard stages={many} layout="summary" />);
    expect(screen.queryAllByText("2 more stages")).toHaveLength(1);
    expect(screen.queryAllByText("Stage 6")).toHaveLength(0);
  });
});

describe("PipelineBoard states and i18n", () => {
  it("Skeleton while loading, empty state for {}, alert on invalid props", () => {
    const a = render(<PipelineBoard stages={stages} loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    a.unmount();
    const b = render(<PipelineBoard />);
    expect(screen.queryAllByText("No pipeline to display")).toHaveLength(1);
    b.unmount();
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard
    render(<PipelineBoard {...({ stages: [{ id: 1 }] } as any)} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });

  it("localises (FR): counts and totals", () => {
    render(<PipelineBoard stages={stages} locale="fr" currency="EUR" />);
    expect(screen.queryAllByText("2 affaires")).toHaveLength(1);
    expect(screen.queryAllByText(/0,30\s?€/)).toHaveLength(1);
  });
});

describe("PipelineBoard schema + A-1 markdown", () => {
  it("defaults so {} parses", () => {
    expect(PipelineBoardPropsSchema.parse({})).toMatchObject({
      stages: [],
      currency: "EUR",
      layout: "board",
      loading: false,
      locale: "en",
    });
  });

  it("tabulates stage, deal count and total, then lists the deals per stage", () => {
    const md = pipelineBoardToMarkdown({ stages, currency: "EUR" }, "en");
    expect(md).toContain("# Pipeline");
    expect(md).toContain("| Lead | 2 | €0.30 |");
    expect(md).toContain("| Won | 1 | €1,000.50 |");
    expect(md).toContain("- Acme (€0.10)");
    expect(md).toContain("Ann");
  });

  it("is localised in FR and meaningful when empty", () => {
    expect(pipelineBoardToMarkdown({ stages }, "fr")).toContain("| Lead | 2 |");
    expect(pipelineBoardToMarkdown({}, "en")).toContain("No pipeline to display");
  });
});
