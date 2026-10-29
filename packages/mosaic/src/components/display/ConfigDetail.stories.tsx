import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DETAIL_CONFIG, DETAIL_PAYLOAD } from "../../view-config/fixtures.js";
import type { ConfigViewBridge } from "../../view-config/view-config.js";
import { ConfigDetail } from "./ConfigDetail.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A demo bridge standing in for `App.callServerTool`; an action returns a text result. */
const demoBridge: ConfigViewBridge = {
  callServerTool: async () => ({ content: [{ type: "text", text: "42 co-owners listed." }] }),
};

const [lilas] = DETAIL_PAYLOAD.condominiums;

/** Two records under `dataPath`: the view asks which one to open first. */
const TWO_RECORDS = {
  condominiums: [
    lilas,
    {
      ...lilas,
      id: "k2",
      title: "Le Clos des Vignes",
      address: { street: "3 allée des Vignes", postal_code: "69005", city: "Lyon" },
      co_owners_count: 18,
      treasury_balance: "-120.40",
      lots_listed: [],
    },
  ],
} as const;

/** One record with most optional values absent: the fields render as empty, never invented. */
const SPARSE_RECORD = {
  condominiums: [
    {
      id: "k3",
      title: "Résidence sans mandat",
      address: { street: null, postal_code: null, city: "Nantes" },
      co_owners_count: null,
      treasury_balance: null,
      ratio: null,
      mandate: null,
      lots_listed: [],
    },
  ],
} as const;

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ConfigDetail> = {
  title: "Display/ConfigDetail",
  component: ConfigDetail,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'ConfigDetail — a detail view described by a view-config/1 `kind: "detail"` config: ' +
          "sections of labelled, formatted fields and nested tables, actions calling other tools. " +
          "Several records under `dataPath` open a chooser first. An action shipped `disabled` " +
          "renders disabled; without a bridge every action does. Bilingual EN/FR.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfigDetail>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: "Default (one record, one action shipped disabled)",
  render: () => (
    <ConfigDetail config={DETAIL_CONFIG} payload={DETAIL_PAYLOAD} bridge={demoBridge} />
  ),
};

export const French: Story = {
  name: "French (labels and formats)",
  render: () => (
    <ConfigDetail config={DETAIL_CONFIG} payload={DETAIL_PAYLOAD} bridge={demoBridge} locale="fr" />
  ),
};

export const Chooser: Story = {
  name: "Chooser (several records)",
  render: () => <ConfigDetail config={DETAIL_CONFIG} payload={TWO_RECORDS} bridge={demoBridge} />,
};

export const Partial: Story = {
  name: "Partial (absent values, empty nested table)",
  render: () => <ConfigDetail config={DETAIL_CONFIG} payload={SPARSE_RECORD} bridge={demoBridge} />,
};

export const Empty: Story = {
  name: "Empty (no record)",
  render: () => (
    <ConfigDetail config={DETAIL_CONFIG} payload={{ condominiums: [] }} bridge={demoBridge} />
  ),
};

export const NoBridge: Story = {
  name: "Disabled actions (no host bridge)",
  render: () => <ConfigDetail config={DETAIL_CONFIG} payload={DETAIL_PAYLOAD} />,
};
