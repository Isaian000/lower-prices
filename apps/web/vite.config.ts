import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// Vercel (define VERCEL=1 al compilar) usa su propio servidor y espera el build estándar
// de React Router. En local o en un servidor propio, el build exporta la app de Express
// de server/app.ts, que usa server.js.
const onVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  environments: onVercel
    ? {}
    : {
        ssr: {
          build: {
            rollupOptions: {
              input: "./server/app.ts",
            },
          },
        },
      },
  css: {
    modules: {
      // Clases legibles en desarrollo, cortas en producción.
      generateScopedName:
        process.env.NODE_ENV === "production"
          ? "[hash:base64:6]"
          : "[name]__[local]__[hash:base64:4]",
    },
  },
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
