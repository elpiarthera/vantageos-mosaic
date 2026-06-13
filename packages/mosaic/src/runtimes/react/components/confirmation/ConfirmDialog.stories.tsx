/**
 * ConfirmDialog stories — @vantageos/mosaic/react/confirmation subpath.
 *
 * Consumes the component through the runtime barrel to exercise the subpath
 * export contract (not the source tree import). Complements the shared
 * src/components/input/ConfirmDialog.stories.tsx which targets the bare source.
 */
import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmDialog } from "./index";

const meta = {
  title: "Confirmation/ConfirmDialog (react runtime)",
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

export const Danger: Story = {
  args: {
    title: "Delete record",
    message: "This action cannot be undone. The record will be permanently removed.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    variant: "danger",
    locale: "en",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const FrenchLocale: Story = {
  name: "FR locale",
  args: {
    title: "Supprimer l'enregistrement",
    message: "Cette action est irréversible. L'enregistrement sera définitivement supprimé.",
    confirmLabel: "Supprimer",
    cancelLabel: "Annuler",
    variant: "danger",
    locale: "fr",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const ErrorState: Story = {
  name: "Error (invalid props)",
  args: {
    // Intentionally invalid props (empty strings fail Zod min(1))
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
