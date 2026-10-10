import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StatCard } from "./StatCard";
import { statCardToMarkdown } from "./StatCard.markdown";
import { StatCardPropsSchema } from "./StatCard.schema";

afterEach(cleanup);

describe("StatCard (R08)", () => {
  it("renders label and value", () => {
    render(<StatCard label="Open deals" value="42" />);
    expect(screen.queryAllByText("Open deals")).toHaveLength(1);
    expect(screen.queryAllByText("42")).toHaveLength(1);
  });

  it("states the trend in words, not only by arrow or colour", () => {
    render(<StatCard label="MRR" value="12000" unit="EUR" trend="up" change="+4.2%" />);
    expect(screen.queryAllByText(/\+4\.2%/)).toHaveLength(1);
    expect(screen.queryAllByText(/^Up$/)).toHaveLength(1);
    expect(screen.queryAllByText("EUR")).toHaveLength(1);
  });

  it("localises the trend word (FR)", () => {
    render(<StatCard label="MRR" value="1" trend="down" locale="fr" />);
    expect(screen.queryAllByText("En baisse")).toHaveLength(1);
  });

  it("is a labelled region exposing the metric to assistive tech", () => {
    render(<StatCard label="MRR" value="12" />);
    expect(screen.queryAllByRole("region", { name: /MRR/ })).toHaveLength(1);
  });

  it("shows a Skeleton instead of the value while loading", () => {
    render(<StatCard label="MRR" value="12" loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryAllByText("12")).toHaveLength(0);
  });

  it("accepts empty args (ChatGPT entrypoint opens with {}) and says there is nothing to show", () => {
    render(<StatCard />);
    expect(screen.queryAllByText("No statistic to display")).toHaveLength(1);
  });

  it("renders an alert on invalid props rather than throwing", () => {
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard
    render(<StatCard {...({ value: 12 } as any)} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });
});

describe("StatCard schema + A-1 markdown", () => {
  it("defaults every field so {} parses", () => {
    const p = StatCardPropsSchema.parse({});
    expect(p).toMatchObject({
      label: "",
      value: "",
      tone: "neutral",
      loading: false,
      locale: "en",
    });
    expect(StatCardPropsSchema.safeParse({ trend: "sideways" }).success).toBe(false);
  });

  it("carries the DATA in markdown (label, value, unit, trend, change), EN", () => {
    const md = statCardToMarkdown(
      { label: "MRR", value: "12000", unit: "EUR", trend: "up", change: "+4.2%" },
      "en",
    );
    expect(md).toContain("# Statistic");
    expect(md).toContain("MRR");
    expect(md).toContain("12000 EUR");
    expect(md).toContain("Up");
    expect(md).toContain("+4.2%");
  });

  it("is localised in FR and meaningful when empty", () => {
    expect(statCardToMarkdown({ label: "MRR", value: "1", trend: "down" }, "fr")).toContain(
      "En baisse",
    );
    expect(statCardToMarkdown({}, "en")).toContain("No statistic to display");
  });
});
