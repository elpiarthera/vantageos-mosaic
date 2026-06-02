import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Exclude Playwright a11y specs — those run via `playwright test`, not vitest
    exclude: ["tests/a11y/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 90, functions: 100, branches: 100 },
      include: ["src/components/**"],
    },
  },
});
