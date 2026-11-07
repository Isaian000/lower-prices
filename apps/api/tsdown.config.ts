import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/server.ts", "src/app.ts"],
  format: "esm",
  platform: "node",
  outDir: "dist",
  // Los paquetes internos exportan TypeScript sin compilar, así que se incluyen en el bundle.
  noExternal: [/^@lower-prices\//],
});
