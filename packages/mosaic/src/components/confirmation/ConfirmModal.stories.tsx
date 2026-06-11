/**
 * Storybook stories for the `ConfirmModal` alias.
 *
 * `ConfirmModal` is a zero-cost re-export of `ConfirmDialog` exposed on
 * the `@vantageos/mosaic/react/confirmation` and `@vantageos/mosaic/preact/confirmation`
 * runtime barrels. These stories document the alias under the
 * Confirmation taxonomy so consumers who navigate by category find it.
 *
 * For the canonical component documentation, refer to the
 * `Input/ConfirmDialog` story group — the implementation is identical.
 */
import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmModal } from "../../runtimes/react/components/confirmation";

const meta = {
  title: "Confirmation/ConfirmModal (alias of ConfirmDialog)",
  component: ConfirmModal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Alias of `ConfirmDialog` (input category). Provided on the " +
          "`react/confirmation` and `preact/confirmation` runtime barrels " +
          "to honor the Chi gptpowerups-extension naming contract. " +
          "Behaviour, props, schema, i18n keys, and a11y are identical " +
          "to the canonical `Input/ConfirmDialog`.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "danger"] },
    locale: { control: "select", options: ["en", "fr"] },
  },
} satisfies Meta<typeof ConfirmModal>;

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
    title: "Delete repository",
    message: "This will permanently remove the repository and all associated data.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    variant: "danger",
    locale: "en",
    onConfirm: () => {},
    onCancel: () => {},
  },
};
