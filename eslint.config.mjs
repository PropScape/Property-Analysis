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
  ]),

  // ─── Architecture layer guards (ADR-004 + ADR-008) ───────────────────────
  //
  // Rule 1: src/config/ must stay framework-free.
  //   Config files are pure data / resolver functions. They must never import
  //   React, Next.js, components, stores, or calculation modules so they can
  //   be reused in any runtime (Node, Deno, tests, future API service).
  {
    files: ["src/config/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom"], message: "Config files must be framework-free (ADR-008)." },
            { group: ["next", "next/*"], message: "Config files must be framework-free (ADR-008)." },
            { group: ["@supabase/*"], message: "Config files must be framework-free (ADR-008)." },
            { group: ["zustand", "zustand/*"], message: "Config files must be framework-free (ADR-008)." },
            { group: ["@/components/*"], message: "Config must not import from UI layer (ADR-008)." },
            { group: ["@/stores/*"], message: "Config must not import from stores (ADR-008)." },
            { group: ["@/actions/*"], message: "Config must not import from actions (ADR-008)." },
            { group: ["@/domain/calculations/*"], message: "Config must not import from calculations — only domain/types/ is allowed (ADR-008)." },
          ],
        },
      ],
    },
  },

  // Rule 2: src/domain/ must be framework-free.
  //   Domain files (types, schemas, calculations) are portable TypeScript.
  //   They may import from src/config/ and zod only.
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom"], message: "Domain layer must be framework-free (ADR-004)." },
            { group: ["next", "next/*"], message: "Domain layer must be framework-free (ADR-004)." },
            { group: ["@supabase/*"], message: "Domain layer must not import infrastructure (ADR-004)." },
            { group: ["zustand", "zustand/*"], message: "Domain layer must be framework-free (ADR-004)." },
            { group: ["@/components/*"], message: "Domain must not import from UI layer (ADR-004)." },
            { group: ["@/stores/*"], message: "Domain must not import from stores (ADR-004)." },
            { group: ["@/actions/*"], message: "Domain must not import from actions (ADR-004)." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
