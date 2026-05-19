import { defineConfig, globalIgnores } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

const eslintConfig = defineConfig([
  ...expoConfig,
  globalIgnores([
    // Build / scratch output
    "dist/**",
    ".expo/**",
    "spike/**",
    // CJS config files Expo ships at root
    "tailwind.config.js",
    "babel.config.js",
    "metro.config.js",
  ]),
  // Enforce src/server/** as a server-only boundary. Only server-side code
  // (API routes, other server modules) may import from it. Type-only
  // imports are allowed so the universal client can share type signatures.
  {
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/server/*", "@/server/*/*", "**/src/server/*"],
            message:
              "src/server/** is server-only. Import only from API routes (app/api/**+api.ts) or other src/server modules.",
            allowTypeImports: true,
          },
        ],
      }],
    },
  },
  {
    files: [
      "app/api/**/*.ts",
      "app/**/+api.ts",
      "src/server/**/*.ts",
    ],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;

