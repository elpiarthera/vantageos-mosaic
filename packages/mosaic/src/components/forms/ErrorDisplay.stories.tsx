// Storybook documentation for ErrorDisplay
import type { Meta, StoryObj } from "@storybook/react";
import { ErrorDisplay } from "../../runtimes/react/components/forms/ErrorDisplay.js";

const meta: Meta<typeof ErrorDisplay> = {
  title: "Forms/ErrorDisplay",
  component: ErrorDisplay,
  parameters: {
    docs: {
      description: {
        component:
          "Single-field error formatter. Renders nothing when `error` is undefined. " +
          "Otherwise emits `role=alert` with the resolved message. " +
          "Priority: explicit `error.message` → `messageMap[error.type]` → generic fallback.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ErrorDisplay>;

export const ExplicitMessage: Story = {
  name: "Explicit message",
  args: { error: { type: "custom", message: "Custom error message" } },
};

export const MessageMapFallback: Story = {
  name: "messageMap fallback (i18n)",
  args: {
    error: { type: "required" },
    messageMap: { required: "Ce champ est requis" },
  },
};

export const GenericFallback: Story = {
  name: "Generic fallback",
  args: { error: { type: "unknown-type" } },
};

export const NoError: Story = {
  name: "No error (renders nothing)",
  args: {},
};
