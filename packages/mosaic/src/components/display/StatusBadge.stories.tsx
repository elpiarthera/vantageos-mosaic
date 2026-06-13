import type { Meta, StoryObj } from "@storybook/react";
import type React from "react";
import { StatusBadge } from "../../runtimes/react/components/display/StatusBadge.js";

const meta: Meta = {
  title: "Display/StatusBadge",
  component: StatusBadge as React.ComponentType<Record<string, unknown>>,
  parameters: {
    docs: {
      description: {
        component:
          "StatusBadge — inline status indicator with 5 semantic variants (success / warning / danger / info / neutral). " +
          "Uses `<output>` for implicit role=status. Bilingue EN/FR. " +
          "Accepts `Record<string, unknown>` for MCP postMessage injection safety — invalid props render an accessible error fallback.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    status: "active",
    variant: "success",
    locale: "en",
  },
};

export const Warning: Story = {
  args: {
    status: "pending",
    variant: "warning",
    locale: "en",
  },
};

export const Danger: Story = {
  args: {
    status: "error",
    variant: "danger",
    locale: "en",
  },
};

export const Info: Story = {
  args: {
    status: "loading",
    variant: "info",
    label: "Loading…",
    locale: "en",
  },
};

export const Neutral: Story = {
  args: {
    status: "unknown",
    variant: "neutral",
    locale: "en",
  },
};

export const FrenchLocale: Story = {
  name: "FR — label personnalisé",
  args: {
    status: "en_attente",
    label: "En attente",
    variant: "warning",
    locale: "fr",
  },
};

export const InvalidPropsEN: Story = {
  name: "Error fallback — EN (invalid props)",
  args: {
    status: 123,
    variant: "invalid_variant",
  },
};

export const InvalidPropsFR: Story = {
  name: "Error fallback — FR (invalid props)",
  args: {
    status: 123,
    variant: "invalid_variant",
    locale: "fr",
  },
};
