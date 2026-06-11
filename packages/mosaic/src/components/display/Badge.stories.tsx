import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Badge } from "./Badge.react.js";

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Badge> = {
  title: "Display/Badge",
  component: Badge,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inline label/count tag — sister of StatusBadge (media category). Consumer-driven i18n: caller passes already-localized `content`. Supports string labels and numeric counts with full WCAG-AA `aria-label` support.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "secondary", "outline"],
      description: "Visual style variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Padding + font size",
    },
    content: {
      control: "text",
      description: "Label string or numeric count (consumer-driven i18n)",
    },
    "aria-label": {
      control: "text",
      description: "Screen reader label — required when content is a number",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

// ── Variant stories (4 variants × md size) ────────────────────────────────────

export const Default: Story = {
  name: "variant: default",
  args: {
    variant: "default",
    size: "md",
    content: "Default",
  },
};

export const Primary: Story = {
  name: "variant: primary",
  args: {
    variant: "primary",
    size: "md",
    content: "Primary",
  },
};

export const Secondary: Story = {
  name: "variant: secondary",
  args: {
    variant: "secondary",
    size: "md",
    content: "Secondary",
  },
};

export const Outline: Story = {
  name: "variant: outline",
  args: {
    variant: "outline",
    size: "md",
    content: "Outline",
  },
};

// ── Size stories (3 sizes × primary variant) ──────────────────────────────────

export const SizeSmall: Story = {
  name: "size: sm",
  args: {
    variant: "primary",
    size: "sm",
    content: "Small",
  },
};

export const SizeMedium: Story = {
  name: "size: md",
  args: {
    variant: "primary",
    size: "md",
    content: "Medium",
  },
};

export const SizeLarge: Story = {
  name: "size: lg",
  args: {
    variant: "primary",
    size: "lg",
    content: "Large",
  },
};

// ── Numeric count stories ─────────────────────────────────────────────────────

export const NumericCount: Story = {
  name: "content: numeric count",
  args: {
    variant: "primary",
    size: "md",
    content: 42,
    "aria-label": "42 unread notifications",
  },
};

export const ZeroCount: Story = {
  name: "content: zero count",
  args: {
    variant: "secondary",
    size: "sm",
    content: 0,
    "aria-label": "0 messages",
  },
};

// ── All variants side by side ─────────────────────────────────────────────────

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
      <Badge content="Default" variant="default" size="md" />
      <Badge content="Primary" variant="primary" size="md" />
      <Badge content="Secondary" variant="secondary" size="md" />
      <Badge content="Outline" variant="outline" size="md" />
    </div>
  ),
};

// ── All sizes side by side ────────────────────────────────────────────────────

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
      <Badge content="Small" variant="primary" size="sm" />
      <Badge content="Medium" variant="primary" size="md" />
      <Badge content="Large" variant="primary" size="lg" />
    </div>
  ),
};

// ── Typical use-case: label + numeric count together ─────────────────────────

export const LabelAndCount: Story = {
  name: "Label + numeric count",
  render: () => (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Badge content="Pro" variant="primary" size="sm" />
      <Badge content={8} aria-label="8 pending tasks" variant="secondary" size="sm" />
      <Badge content="New" variant="outline" size="sm" />
    </div>
  ),
};

// ── Error fallback ────────────────────────────────────────────────────────────

export const ErrorFallback: Story = {
  name: "Error fallback (invalid props)",
  render: () => {
    const raw: Record<string, unknown> = { content: "" }; // fails Zod — empty string
    return <Badge {...raw} />;
  },
};
