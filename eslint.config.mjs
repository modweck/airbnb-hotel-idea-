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
    // Spike scratch + Expo build output + CJS config files
    "spike/**",
    "dist/**",
    "tailwind.config.js",
    "babel.config.js",
    "metro.config.js",
  ]),
  // Enforce src/server/** as a server-only boundary. Only server-side code
  // (API routes, Server Components, other server modules) may import from it.
  {
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/server/*", "@/server/*/*", "**/src/server/*"],
            message:
              "src/server/** is server-only. Import only from API routes (src/app/api/**), Server Components (page.tsx/layout.tsx), or other src/server modules.",
            allowTypeImports: true,
          },
        ],
      }],
    },
  },
  {
    files: [
      "src/app/api/**/*.ts",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/server/**/*.ts",
      // Post-Expo locations (Phase 6+):
      "app/api/**/*.ts",
      "app/**/+api.ts",
    ],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;

