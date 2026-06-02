import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "Input/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: { control: "select", options: ["default", "danger"] },
    locale: { control: "select", options: ["en", "fr"] },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Confirm action",
    message: "Are you sure you want to proceed? This step cannot be undone.",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default",
    locale: "en",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Loading: Story = {
  args: {
    title: "Processing…",
    message: "Please wait while the action is being processed.",
    confirmLabel: "Processing…",
    cancelLabel: "Cancel",
    variant: "default",
    locale: "en",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: {
    // @ts-expect-error — intentionally invalid props to exercise Zod fallback
    title: "",
    message: "",
    confirmLabel: "",
    cancelLabel: "",
    variant: "default",
    locale: "en",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Empty: Story = {
  args: {
    title: "No items selected",
    message: "There is nothing to confirm. Select an item first.",
    confirmLabel: "OK",
    cancelLabel: "Go back",
    variant: "default",
    locale: "en",
    onConfirm: () => {},
    onCancel: () => {},
  },
};
