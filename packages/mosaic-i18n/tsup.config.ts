import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  treeshake: true,
  clean: true,
  splitting: false,
  external: ["react", "react-dom", "react-i18next", "i18next"],
});
