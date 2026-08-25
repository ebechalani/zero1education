import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not ours to lint: vendored bundles (the pdf.js worker) and the agent
    // session artifacts. Between them they were burying the seven real
    // findings in src under eleven thousand.
    "public/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
