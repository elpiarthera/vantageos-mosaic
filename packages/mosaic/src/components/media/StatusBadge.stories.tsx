import type { Meta, StoryObj } from "@storybook/react";
import type React from "react";
import { StatusBadge } from "./StatusBadge";

const meta: Meta = {
  title: "Media/StatusBadge",
  component: StatusBadge as React.ComponentType<unknown>,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    status: "active",
    variant: "success",
    locale: "en",
  },
};

export const Loading: Story = {
  args: {
    status: "loading",
    variant: "info",
    label: "Loading…",
    locale: "en",
  },
};

export const ErrorState: Story = {
  args: {
    status: 123,
    variant: "invalid_variant",
  },
};

export const Empty: Story = {
  args: {
    status: "",
    variant: "neutral",
    locale: "fr",
  },
};
