// i18nKeys: Skeleton.aria.label, Skeleton.error.invalidProps
import type { Meta, StoryObj } from "@storybook/react";
import type React from "react";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";

const meta: Meta = {
  title: "Display/Skeleton",
  component: Skeleton as React.ComponentType<unknown>,
  parameters: {
    docs: {
      description: {
        component:
          "Zod-validated loading placeholder (Mosaic Pattern 1). " +
          "Three shape variants (rect, circle, text), three animation modes " +
          "(pulse, wave, none). Supports EN/FR locales. " +
          "Renders accessible role=alert fallback on invalid props.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/** Rect: default rectangular block placeholder */
export const Rect: Story = {
  name: "Rect (default)",
  args: {
    variant: "rect",
    width: "100%",
    height: 80,
    animation: "pulse",
    locale: "en",
  },
};

/** Circle: avatar / icon circular placeholder */
export const Circle: Story = {
  name: "Circle",
  args: {
    variant: "circle",
    width: 48,
    animation: "pulse",
    locale: "en",
  },
};

/** Text: multi-line paragraph placeholder (count=3) */
export const TextLines: Story = {
  name: "Text (3 lines)",
  args: {
    variant: "text",
    count: 3,
    animation: "pulse",
    locale: "en",
  },
};

/** Wave animation variant */
export const WaveAnimation: Story = {
  name: "Wave animation",
  args: {
    variant: "rect",
    width: "100%",
    height: 60,
    animation: "wave",
    locale: "en",
  },
};

/**
 * No animation — static placeholder for prefers-reduced-motion or
 * when explicitly passing animation="none".
 */
export const NoAnimation: Story = {
  name: "No animation (reduced-motion)",
  args: {
    variant: "rect",
    width: "100%",
    height: 60,
    animation: "none",
    locale: "en",
  },
};

/**
 * ErrorFallback: invalid props passed intentionally.
 * Exercises the Zod fallback path → renders role=alert banner.
 * variant="hexagon" is not a valid value.
 */
export const ErrorFallback: Story = {
  name: "Error fallback",
  args: {
    variant: "hexagon",
    locale: "en",
  },
};
