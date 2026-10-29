import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { LIST_CONFIG, LIST_PAYLOAD } from "../../view-config/fixtures.js";
import type { ConfigViewBridge } from "../../view-config/view-config.js";
import { ConfigList } from "./ConfigList.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * A demo bridge standing in for `App.callServerTool`: paging returns one more contract and the
 * exhausted flag, a row action returns a text result. Nothing leaves the story.
 */
const demoBridge: ConfigViewBridge = {
  callServerTool: async ({ name }) =>
    name === LIST_CONFIG.tool
      ? {
          structuredContent: {
            contracts: [
              {
                id: "c3",
                reference: "BAIL-003",
                kind: "Candidat",
                tenant_name: "Bernard",
                lots: [{ number: "D4" }],
                start: "2023-09-01",
                end: "2026-08-31",
                rent_ttc: 950,
                is_signed: true,
              },
            ],
            exhausted: true,
            truncated: false,
          },
        }
      : { content: [{ type: "text", text: "Rental situation: up to date." }] },
};

/** The fixture config with totals and a totals scope, to show the partial-totals notice. */
const PARTIAL_CONFIG = {
  ...LIST_CONFIG,
  totals: [
    {
      path: "totals.rent_ttc",
      label: { en: "Total rent incl. VAT", fr: "Total loyers TTC" },
      format: { type: "money", currency: "EUR" },
    },
  ],
  totalsScope: {
    completePath: "totals.complete",
    scopePath: "totals.scope",
    notePath: "totals.note",
  },
} as const;

const PARTIAL_PAYLOAD = {
  ...LIST_PAYLOAD,
  truncated: true,
  totals: {
    rent_ttc: 2034.5,
    complete: false,
    scope: "First 2 of 140 contracts",
    note: "Totals cover the loaded page only",
  },
} as const;

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ConfigList> = {
  title: "Display/ConfigList",
  component: ConfigList,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'ConfigList — a list view described by a view-config/1 `kind: "list"` config: formatted ' +
          "columns, default sort, paging through the cursor, row actions calling another tool. " +
          "Without a bridge, paging and actions render disabled. An invalid config renders a " +
          "visible refusal. Bilingual EN/FR, every label taken from the config.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfigList>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: "Default (contracts, paging and actions wired)",
  render: () => <ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={demoBridge} />,
};

export const French: Story = {
  name: "French (labels from the config)",
  render: () => (
    <ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} bridge={demoBridge} locale="fr" />
  ),
};

export const Empty: Story = {
  name: "Empty (configured empty message)",
  render: () => <ConfigList config={LIST_CONFIG} payload={{ contracts: [] }} bridge={demoBridge} />,
};

export const PartialTotals: Story = {
  name: "Partial (incomplete totals and truncation notices)",
  render: () => (
    <ConfigList config={PARTIAL_CONFIG} payload={PARTIAL_PAYLOAD} bridge={demoBridge} />
  ),
};

export const NoBridge: Story = {
  name: "Disabled actions (no host bridge)",
  render: () => <ConfigList config={LIST_CONFIG} payload={LIST_PAYLOAD} />,
};

export const InvalidConfig: Story = {
  name: "Invalid config (visible refusal)",
  render: () => <ConfigList config={{ kind: "list" }} payload={LIST_PAYLOAD} />,
};
