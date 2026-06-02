import type { Meta, StoryObj } from "@storybook/react";
import { TokenDisplayOnceModal } from "./TokenDisplayOnceModal";

const meta = {
  title: "Confirmation/TokenDisplayOnceModal",
  component: TokenDisplayOnceModal,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    locale: { control: "select", options: ["en", "fr"] },
  },
} satisfies Meta<typeof TokenDisplayOnceModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    token: "tok_demo_xxx_safe_dummy",
    title: "Your API Token",
    warningMessage:
      "This token will only be shown once. Copy it now and store it securely — it cannot be retrieved later.",
    copyLabel: "Copy token",
    closeLabel: "I have copied it",
    locale: "en",
    onClose: () => {},
  },
};

export const Loading: Story = {
  args: {
    token: "tok_demo_xxx_safe_dummy",
    title: "Generating token…",
    warningMessage: "Please wait. Your token is being generated.",
    copyLabel: "Copy token",
    closeLabel: "Cancel",
    locale: "en",
    onClose: () => {},
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: {
    // @ts-expect-error — intentionally invalid props to exercise Zod fallback
    token: "",
    title: "",
    warningMessage: "",
    copyLabel: "",
    closeLabel: "",
    locale: "en",
    onClose: () => {},
  },
};

export const Empty: Story = {
  args: {
    token: "tok_demo_xxx_safe_dummy",
    title: "Jeton d'accès API",
    warningMessage:
      "Ce jeton ne sera affiché qu'une seule fois. Copiez-le maintenant et conservez-le en lieu sûr.",
    copyLabel: "Copier le jeton",
    closeLabel: "Je l'ai copié",
    locale: "fr",
    onClose: () => {},
  },
};
