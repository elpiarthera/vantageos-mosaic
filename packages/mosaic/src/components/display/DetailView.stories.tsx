import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DetailView } from "./DetailView.js";
import type { DetailViewProps } from "./DetailView.schema.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const condo: DetailViewProps = {
  title: "Résidence des Lilas",
  sections: [
    {
      id: "identity",
      title: "Identity",
      fields: [
        { label: "Name", value: "Résidence des Lilas" },
        { label: "City", value: "Paris" },
        { label: "Since", value: "2023-01-01", format: { type: "date" } },
        { label: "Active", value: true, format: { type: "boolean" } },
      ],
    },
    {
      id: "figures",
      title: "Figures",
      fields: [
        { label: "Co-owners", value: 42, format: { type: "number" } },
        {
          label: "Treasury balance",
          value: "15234.80",
          format: { type: "money", currency: "EUR" },
        },
        { label: "Occupancy", value: 87.5, format: { type: "percent" } },
      ],
    },
    {
      id: "lots",
      title: "Lots",
      table: {
        columns: [
          { key: "code", header: "Code" },
          { key: "type", header: "Type" },
          { key: "area", header: "Living area (m²)", path: "a.m2", format: { type: "number" } },
        ],
        rows: [
          { code: "A1", type: "Apartment", a: { m2: 54.2 } },
          { code: "P7", type: "Parking", a: { m2: null } },
        ],
      },
    },
  ],
};

/** Absent and null values show a dash; the nested table has no rows. Nothing is invented. */
const sparse: DetailViewProps = {
  title: "Résidence sans mandat",
  sections: [
    {
      id: "identity",
      title: "Identity",
      fields: [
        { label: "Name", value: "Résidence sans mandat" },
        { label: "Street", value: null },
        { label: "Mandate start" },
      ],
    },
    {
      id: "lots",
      title: "Lots",
      table: { columns: [{ key: "code", header: "Code" }], rows: [] },
    },
  ],
};

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof DetailView> = {
  title: "Display/DetailView",
  component: DetailView,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "DetailView — one record as a labelled article: sections of formatted fields (description " +
          "lists) and nested tables named after their section. `{}` parses and shows an empty " +
          "state; a Skeleton while loading; invalid props render an alert. Bilingual EN/FR.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DetailView>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: "Default (sections, formats, nested table)",
  render: () => <DetailView {...condo} />,
};

export const French: Story = {
  name: "French (chrome and formats)",
  render: () => <DetailView {...condo} locale="fr" />,
};

export const Partial: Story = {
  name: "Partial (absent values, empty nested table)",
  render: () => <DetailView {...sparse} />,
};

export const Empty: Story = {
  name: "Empty ({} parses)",
  render: () => <DetailView />,
};

export const Loading: Story = {
  name: "Loading (Skeleton)",
  render: () => <DetailView {...condo} loading />,
};

export const InvalidProps: Story = {
  name: "Invalid props (alert)",
  render: () => <DetailView {...({ sections: "not-a-list" } as unknown as DetailViewProps)} />,
};
