import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    progress: "src/components/progress/index.ts",
    input: "src/components/input/index.ts",
    display: "src/components/display/index.ts",
    artifacts: "src/components/artifacts/index.ts",
    confirmation: "src/components/confirmation/index.ts",
    media: "src/components/media/index.ts",
    server: "src/server/create-mosaic-resource.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: ["react", "react-dom", "react-i18next", "@mcp-ui/client", "rxjs"],
});
