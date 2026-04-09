import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  outDir: "dist",
  platform: "node",
  clean: true,
  outExtensions: () => ({ js: ".js" }),
  deps: {
    onlyBundle: false,
  },
});
