import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // 15s test timeout — Forms tests pay a 1-2s RHF/zodResolver boot cost on
    // the first test of each file inside the slow jsdom + transform pipeline.
    testTimeout: 15_000,
    // Exclude Playwright a11y specs — those run via `playwright test`, not vitest
    exclude: ["tests/a11y/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 90, functions: 100, branches: 100 },
      include: ["src/components/**"],
      exclude: [
        "**/*.stories.tsx",
        "**/index.ts",
        "**/eval-corpus.json",
        "src/hooks/**",
        "src/adapters/**",
        "src/i18n/**",
        "src/server/**",
      ],
    },
  },
});
