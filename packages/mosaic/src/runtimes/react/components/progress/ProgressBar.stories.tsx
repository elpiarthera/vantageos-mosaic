// i18nKeys: ProgressBar.aria.label, ProgressBar.error.invalidProps
import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar.js";

const meta: Meta = {
  title: "React/Progress/ProgressBar",
  component: ProgressBar as React.ComponentType<unknown>,
  parameters: {
    docs: {
      description: {
        component:
          "React 19 runtime subpath for ProgressBar. Wraps the BARE implementation " +
          "(`@vantageos/mosaic/react/progress`). Zod-validated, WCAG-AA, EN/FR i18n, " +
          "three color variants, role=alert fallback on invalid props.",
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

/** Warning: 80% with amber variant */
export const Warning: Story = {
  name: "Warning",
  args: {
    value: 80,
    label: "Disk Usage",
    locale: "en",
    colorVariant: "warning",
  },
};

/** Danger: 95% with red variant */
export const Danger: Story = {
  name: "Danger",
  args: {
    value: 95,
    label: "CPU Load",
    locale: "en",
    colorVariant: "danger",
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

/** Complete: 100% */
export const Complete: Story = {
  name: "Complete",
  args: {
    value: 100,
    label: "Upload",
    locale: "en",
    colorVariant: "default",
  },
};

/** French locale */
export const FrenchLocale: Story = {
  name: "FR — locale=fr",
  args: {
    value: 60,
    label: "Progression",
    locale: "fr",
    colorVariant: "default",
  },
};

/**
 * ErrorFallback: invalid props passed intentionally.
 * Exercises the Zod fallback path → renders role=alert banner.
 * value=150 exceeds max(100); label="" violates min(1).
 */
export const ErrorFallback: Story = {
  name: "Error Fallback",
  args: {
    value: 150,
    label: "",
    locale: "en",
    colorVariant: "default",
  },
};
