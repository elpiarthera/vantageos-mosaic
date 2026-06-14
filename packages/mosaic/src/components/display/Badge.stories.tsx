import type { Meta, StoryObj } from "@storybook/react";
import type React from "react";
import { Badge } from "../../runtimes/react/components/display/Badge.js";

const meta: Meta = {
  title: "Display/Badge",
  component: Badge as React.ComponentType<Record<string, unknown>>,
  parameters: {
    docs: {
      description: {
        component:
          "Badge — generic visual label primitive with 7 semantic variants " +
          "(default / primary / success / warning / danger / info / neutral). " +
          "Supports optional dot indicator and count. Bilingue EN/FR. " +
          "Accepts `Record<string, unknown>` for MCP postMessage injection safety — " +
          "invalid props render an accessible error fallback. " +
          "Sister primitive of StatusBadge (which uses <output> for role=status). " +
          "Target: @vantageos/mosaic 0.3.2.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Tag",
    variant: "default",
    locale: "en",
  },
};

export const Primary: Story = {
  args: {
    label: "New",
    variant: "primary",
    locale: "en",
  },
};

export const Success: Story = {
  args: {
    label: "Active",
    variant: "success",
    locale: "en",
  },
};

export const Warning: Story = {
  args: {
    label: "Pending",
    variant: "warning",
    locale: "en",
  },
};

export const Danger: Story = {
  args: {
    label: "Deprecated",
    variant: "danger",
    locale: "en",
  },
};

export const Info: Story = {
  args: {
    label: "Beta",
    variant: "info",
    locale: "en",
  },
};

export const Neutral: Story = {
  args: {
    label: "Unknown",
    variant: "neutral",
    locale: "en",
  },
};

export const WithDot: Story = {
  name: "With dot indicator",
  args: {
    label: "Live",
    variant: "success",
    dot: true,
    locale: "en",
  },
};

export const WithCount: Story = {
  name: "With count",
  args: {
    label: "Notifications",
    variant: "primary",
    count: 12,
    locale: "en",
  },
};

export const WithDotAndCount: Story = {
  name: "Dot + count combined",
  args: {
    label: "Updates",
    variant: "warning",
    dot: true,
    count: 3,
    locale: "en",
  },
};

export const FrenchLocale: Story = {
  name: "FR — étiquette personnalisée",
  args: {
    label: "Nouveau",
    variant: "primary",
    locale: "fr",
  },
};

export const InvalidPropsEN: Story = {
  name: "Error fallback — EN (invalid props)",
  args: {
    variant: "success",
  },
};

export const InvalidPropsFR: Story = {
  name: "Error fallback — FR (invalid props)",
  args: {
    variant: "success",
    locale: "fr",
  },
};
