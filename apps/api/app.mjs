// Entrada de la API en Vercel. Vercel busca `app.mjs` en la raíz antes que `src/app.ts`;
// así sirve el JavaScript que ya compiló `pnpm build` (tsdown) en vez de recompilar el
// TypeScript con su propia configuración, que no respeta la del proyecto.
import app from "./dist/app.mjs";

export default app;
