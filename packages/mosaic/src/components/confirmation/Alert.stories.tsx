import type { Meta, StoryObj } from "@storybook/react";
// StoryObj imported for DismissibleToggle render-only story (no args)
import { useState } from "react";
import { Alert } from "../../runtimes/react/components/confirmation/Alert";

const meta = {
  title: "Confirmation/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Persistent inline banner. Contrast with Toast (ephemeral + auto-dismissing). Alert stays in document flow until explicitly dismissed or condition resolves.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["success", "error", "info", "warning"] },
    locale: { control: "select", options: ["en", "fr"] },
    dismissible: { control: "boolean" },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: "success",
    title: "Changes saved successfully",
    description: "Your profile has been updated.",
    locale: "en",
  },
};

export const AlertError: Story = {
  name: "Error",
  args: {
    variant: "error",
    title: "Failed to save changes",
    description: "Please check your network connection and try again.",
    locale: "en",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    title: "System maintenance tonight",
    description: "Scheduled downtime from 02:00 to 04:00 UTC.",
    locale: "en",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Your subscription expires in 3 days",
    description: "Renew now to avoid service interruption.",
    locale: "en",
  },
};

function DismissibleAlertDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <div className="flex flex-col gap-4">
      {visible ? (
        <Alert
          variant="info"
          title="You can dismiss this alert"
          description="Click the X button to dismiss."
          dismissible={true}
          onDismiss={() => setVisible(false)}
          locale="en"
        />
      ) : (
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="text-sm text-blue-600 underline"
        >
          Show alert again
        </button>
      )}
    </div>
  );
}

export const DismissibleToggle = {
  name: "Dismissible (interactive)",
  render: () => <DismissibleAlertDemo />,
} satisfies StoryObj<typeof Alert>;

export const WithDescription: Story = {
  args: {
    variant: "warning",
    title: "Incomplete profile",
    description:
      "Add your phone number and billing address to unlock all features. Missing fields are highlighted below.",
    dismissible: false,
    locale: "en",
  },
};

export const FrenchLocale: Story = {
  name: "French locale (dismissible)",
  args: {
    variant: "error",
    title: "Erreur de connexion",
    description: "Vérifiez votre connexion réseau et réessayez.",
    dismissible: true,
    onDismiss: () => {},
    locale: "fr",
  },
};
