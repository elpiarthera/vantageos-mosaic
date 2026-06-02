import type { StorybookConfig } from "@storybook/react";

const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite" as never,
    options: {},
  },
};

export default config;
