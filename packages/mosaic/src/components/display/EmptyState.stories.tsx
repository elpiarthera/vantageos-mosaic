import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState";

// ── Helpers ───────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  );
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof EmptyState> = {
  title: "Display/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Empty-set display primitive. Consumer-driven i18n: caller passes already-localized strings. Renders role=status wrapper + h2 title + optional description + optional CTA button. Cross-runtime: React 19 + Preact 10.",
      },
    },
  },
  argTypes: {
    locale: { control: "select", options: ["en", "fr"] },
    action: { control: false },
    icon: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ── Story 1: Minimal — title only ────────────────────────────────────────────

export const TitleOnly: Story = {
  name: "Minimal — title only",
  args: {
    title: "No results found",
    locale: "en",
  },
};

// ── Story 2: Full — icon + description + CTA ──────────────────────────────────

export const FullWithIconAndCTA: Story = {
  name: "Full — icon + description + CTA",
  render: () => (
    <EmptyState
      title="Your inbox is empty"
      description="When you receive messages, they'll appear here. Start a conversation to get things moving."
      icon={<InboxIcon />}
      action={{
        label: "Start a conversation",
        variant: "primary",
        onClick: () => {
          console.log("CTA clicked");
        },
      }}
      locale="en"
    />
  ),
};

// ── Story 3: CTA secondary (disabled-like appearance, still interactive) ─────

export const WithSecondaryAction: Story = {
  name: "Secondary CTA action",
  render: () => (
    <EmptyState
      title="No search results"
      description="Try adjusting your search terms or clearing the active filters."
      icon={<SearchIcon />}
      action={{
        label: "Clear all filters",
        variant: "secondary",
        onClick: () => {
          console.log("Clear filters clicked");
        },
      }}
      locale="en"
    />
  ),
};
