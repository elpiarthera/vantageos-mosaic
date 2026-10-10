import { cleanup, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it } from "vitest";
import * as preactConfirmation from "./preact/components/confirmation/index.js";
import * as preactDisplay from "./preact/components/display/index.js";
import * as preactProgress from "./preact/components/progress/index.js";
import * as reactConfirmation from "./react/components/confirmation/index.js";
import * as reactDisplay from "./react/components/display/index.js";
import * as reactProgress from "./react/components/progress/index.js";

afterEach(cleanup);

// Delivery 2 views are ONE shared implementation re-exported by both runtime barrels (the tsup
// preact pass aliases react -> preact/compat). Test-after parity smoke: both barrels expose the
// same names, and each name renders through the runtime barrel it is imported from.
const VIEWS = [
  ["display", "StatCard", { label: "MRR", value: "12" }, "MRR"],
  ["display", "BalanceCard", { token: "FUSE", balance: "1.5" }, "1.5"],
  [
    "display",
    "MessageFeed",
    { messages: [{ sender: "pi", content: "hello feed", timestamp: "2026-10-10T08:00:00Z" }] },
    "hello feed",
  ],
  [
    "display",
    "PipelineBoard",
    { stages: [{ id: "s", name: "Lead", deals: [] }], layout: "summary" },
    "Lead",
  ],
  ["progress", "Timeline", { steps: [{ title: "Build", status: "done" }] }, "Build"],
  ["confirmation", "TransactionPreview", { from: "0xfrom" }, "0xfrom"],
] as const;

const barrels = {
  react: { display: reactDisplay, progress: reactProgress, confirmation: reactConfirmation },
  preact: { display: preactDisplay, progress: preactProgress, confirmation: preactConfirmation },
} as const;

describe("delivery 2 views: react and preact barrels", () => {
  for (const [category, name, props, text] of VIEWS) {
    for (const runtime of ["react", "preact"] as const) {
      it(`${runtime}/${category} exports ${name}, its schema and validator, and renders it`, () => {
        const barrel = barrels[runtime][category] as unknown as Record<string, unknown>;
        expect(typeof barrel[name]).toBe("function");
        expect(barrel[`${name}PropsSchema`]).toBeDefined();
        expect(typeof barrel[`validate${name}Props`]).toBe("function");
        const View = barrel[name] as React.ComponentType<Record<string, unknown>>;
        render(<View {...(props as Record<string, unknown>)} />);
        expect(screen.queryAllByText(text as string).length).toBeGreaterThan(0);
      });
    }
  }
});
