import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "../../runtimes/react/components/confirmation/Toast";

const meta = {
  title: "Confirmation/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "info", "warning"],
    },
    locale: { control: "select", options: ["en", "fr"] },
    duration: { control: "number" },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: "success",
    title: "Changes saved",
    description: "Your profile has been updated successfully.",
    locale: "en",
    onClose: () => {},
  },
};

export const ErrorVariant: Story = {
  name: "Error",
  args: {
    variant: "error",
    title: "Something went wrong",
    description: "Unable to save changes. Please try again.",
    locale: "en",
    onClose: () => {},
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    title: "New version available",
    description: "Refresh the page to get the latest features.",
    locale: "en",
    onClose: () => {},
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Session expiring soon",
    description: "Your session will expire in 5 minutes.",
    locale: "en",
    onClose: () => {},
  },
};

export const Dismissible: Story = {
  args: {
    variant: "info",
    title: "Click X to dismiss",
    description: "This toast has a close button — click it or press ESC.",
    locale: "en",
    onClose: () => {},
  },
};

export const Persistent: Story = {
  name: "Persistent (duration=0)",
  args: {
    variant: "warning",
    title: "Action required",
    description: "This notification will not auto-dismiss. You must close it manually.",
    duration: 0,
    locale: "en",
    onClose: () => {},
  },
};

export const TitleOnly: Story = {
  name: "Title only (no description)",
  args: {
    variant: "success",
    title: "Copied to clipboard",
    locale: "en",
    onClose: () => {},
  },
};

export const FrenchLocale: Story = {
  name: "FR locale",
  args: {
    variant: "info",
    title: "Nouvelle version disponible",
    description: "Rechargez la page pour accéder aux dernières fonctionnalités.",
    locale: "fr",
    onClose: () => {},
  },
};
