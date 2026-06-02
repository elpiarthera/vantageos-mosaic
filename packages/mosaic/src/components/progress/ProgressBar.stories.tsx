// i18nKeys: ProgressBar.aria.label, ProgressBar.error.invalidProps
import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar.js";

const meta: Meta = {
  title: "Progress/ProgressBar",
  component: ProgressBar as React.ComponentType<unknown>,
  parameters: {
    docs: {
      description: {
        component:
          "Zod-validated progress bar (Pattern 1 reference impl). " +
          "Supports EN/FR locales, three color variants, and renders an accessible " +
          "role=alert fallback on invalid props instead of throwing.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/** Default: 75% budget progress, locale=en */
export const Default: Story = {
  name: "Default",
  args: {
    value: 75,
    label: "Budget",
    locale: "en",
    colorVariant: "default",
  },
};

/** Loading: 0% — simulate a freshly-started job */
export const Loading: Story = {
  name: "Loading",
  args: {
    value: 0,
    label: "Loading…",
    locale: "en",
    colorVariant: "default",
  },
};

/**
 * ErrorFallback: invalid props passed intentionally.
 * Exercises the Zod fallback path → renders role=alert banner.
 * value=150 exceeds max(100); label="" violates min(1).
 */
export const ErrorFallback: Story = {
  name: "Error",
  args: {
    value: 150,
    label: "",
    locale: "en",
    colorVariant: "default",
  },
};

/** Empty: 0% with locale=fr (Progression label) */
export const Empty: Story = {
  name: "Empty",
  args: {
    value: 0,
    label: "Progression",
    locale: "fr",
    colorVariant: "warning",
  },
};
