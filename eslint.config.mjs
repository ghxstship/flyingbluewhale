import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import jsxA11y from "eslint-plugin-jsx-a11y";

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      // Accessibility — block on serious WCAG violations
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/label-has-associated-control": ["error", { assert: "either" }],
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/service-worker.js",
      "src/lib/supabase/database.types.ts",
    ],
  },
];

export default config;
