import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";
import { visibleSteps } from "./Timeline.logic";
import { timelineToMarkdown } from "./Timeline.markdown";
import { TimelinePropsSchema } from "./Timeline.schema";

afterEach(cleanup);

// R02: missions as vertical / horizontal status steps (mcpcn progress-steps analogue).
// Claude inline: collapsed to current + next, no drill-in; fullscreen: the full timeline.
const steps = [
  { id: "a", title: "Brief", status: "done" as const, timestamp: "2026-10-01T09:00:00Z" },
  { id: "b", title: "Build", status: "done" as const },
  { id: "c", title: "Review", status: "current" as const, description: "Waiting on Eta" },
  { id: "d", title: "Merge", status: "pending" as const },
  { id: "e", title: "Publish", status: "pending" as const },
];

describe("Timeline logic: compact (inline) visibility", () => {
  it("shows every step when not compact", () => {
    const v = visibleSteps(steps, false);
    expect(v.visible).toHaveLength(5);
    expect(v.hiddenBefore).toBe(0);
    expect(v.hiddenAfter).toBe(0);
  });

  it("compact shows the current step and the next one, counting what it hides", () => {
    const v = visibleSteps(steps, true);
    expect(v.visible.map((s) => s.title)).toEqual(["Review", "Merge"]);
    expect(v.hiddenBefore).toBe(2);
    expect(v.hiddenAfter).toBe(1);
  });

  it("compact with no current step anchors on the first unfinished one", () => {
    const v = visibleSteps(
      [
        { title: "A", status: "done" as const },
        { title: "B", status: "pending" as const },
        { title: "C", status: "pending" as const },
      ],
      true,
    );
    expect(v.visible.map((s) => s.title)).toEqual(["B", "C"]);
  });

  it("compact with everything done shows the last step", () => {
    const v = visibleSteps(
      [
        { title: "A", status: "done" as const },
        { title: "B", status: "done" as const },
      ],
      true,
    );
    expect(v.visible.map((s) => s.title)).toEqual(["B"]);
    expect(v.hiddenBefore).toBe(1);
  });

  it("compact on an empty list is empty", () => {
    expect(visibleSteps([], true).visible).toEqual([]);
  });
});

describe("Timeline (R02)", () => {
  it("renders an ordered list of steps with status in words", () => {
    render(<Timeline steps={steps} />);
    const list = screen.queryAllByRole("list");
    expect(list).toHaveLength(1);
    expect(within(list[0] as HTMLElement).queryAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryAllByText("In progress")).toHaveLength(1);
    expect(screen.queryAllByText("Done")).toHaveLength(2);
    expect(screen.queryAllByText("Waiting on Eta")).toHaveLength(1);
  });

  it("marks the current step with aria-current=step", () => {
    render(<Timeline steps={steps} />);
    const current = document.querySelectorAll('[aria-current="step"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toContain("Review");
  });

  it("exposes orientation", () => {
    render(<Timeline steps={steps} orientation="horizontal" />);
    expect(screen.queryAllByRole("list")[0]?.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("compact hides the other steps and says how many", () => {
    render(<Timeline steps={steps} compact />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryAllByText("2 completed")).toHaveLength(1);
    expect(screen.queryAllByText("1 more")).toHaveLength(1);
  });

  it("formats the timestamp in the locale and timezone given", () => {
    render(<Timeline steps={steps} timeZone="UTC" />);
    expect(screen.queryAllByText(/Oct 1, 2026/)).toHaveLength(1);
    cleanup();
    render(<Timeline steps={steps} timeZone="UTC" locale="fr" />);
    expect(screen.queryAllByText(/1 oct\. 2026/)).toHaveLength(1);
  });

  it("localises status words (FR)", () => {
    render(<Timeline steps={steps} locale="fr" />);
    expect(screen.queryAllByText("En cours")).toHaveLength(1);
  });

  it("Skeleton while loading, empty state for {}, alert on invalid props", () => {
    const { unmount } = render(<Timeline steps={steps} loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryAllByRole("list")).toHaveLength(0);
    unmount();
    const r2 = render(<Timeline />);
    expect(screen.queryAllByText("No steps to display")).toHaveLength(1);
    r2.unmount();
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard
    render(<Timeline {...({ steps: [{ title: "x", status: "weird" }] } as any)} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });
});

describe("Timeline schema + A-1 markdown", () => {
  it("defaults so {} parses", () => {
    expect(TimelinePropsSchema.parse({})).toMatchObject({
      steps: [],
      orientation: "vertical",
      compact: false,
      loading: false,
      locale: "en",
    });
  });

  it("lists every step with its status and description as an ordered list", () => {
    const md = timelineToMarkdown({ steps, timeZone: "UTC" }, "en");
    expect(md).toContain("# Timeline");
    expect(md).toContain("1. [Done] Brief");
    expect(md).toContain("3. [In progress] Review");
    expect(md).toContain("Waiting on Eta");
    expect(md).toContain("5. [Pending] Publish");
  });

  it("is localised in FR and meaningful when empty", () => {
    expect(timelineToMarkdown({ steps }, "fr")).toContain("[Terminé] Brief");
    expect(timelineToMarkdown({}, "en")).toContain("No steps to display");
  });
});
