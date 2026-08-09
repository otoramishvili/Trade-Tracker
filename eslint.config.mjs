import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // These pages fetch Firestore data in an awaited callback invoked by an
      // effect. The rule treats the callback invocation as a synchronous set.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "work/**", "outputs/**", "next-env.d.ts"]),
]);
