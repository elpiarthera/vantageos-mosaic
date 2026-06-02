import type { StorybookConfig } from "@storybook/react-vite";
import type { UserConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config: UserConfig) {
    // storybook/internal/preview/runtime is referenced by builder-vite but not exported
    // by storybook 8.6.18 — externalize it so Rollup doesn't try to bundle it.
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        external: [
          ...((config.build?.rollupOptions?.external as string[]) ?? []),
          "storybook/internal/preview/runtime",
        ],
      },
    };
    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [
        ...(config.optimizeDeps?.exclude ?? []),
        "storybook/internal/preview/runtime",
      ],
    };
    return config;
  },
};

export default config;
