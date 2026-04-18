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
      // CHROMA BEACON — no hex/rgb/rgba literals in JSX string attributes.
      // Whitelisted files: brand SVGs, admin color pickers, open graph,
      // isolated print stylesheets. Everything else must consume tokens.
      "no-restricted-syntax": ["warn", {
        selector: "JSXAttribute Literal[value=/#[0-9a-fA-F]{3,8}/]",
        message: "Use a CSS variable (--text, --surface, --accent...) instead of a hex literal. If this is a brand SVG or user-input default, add the file to the eslint ignores list.",
      }],
    },
  },
  {
    // API envelope enforcement — every /api/v1/* response MUST go through
    // apiOk / apiCreated / apiError / parseJson from @/lib/api, so the
    // { ok, data } / { ok, error } contract is not silently broken.
    // The only legitimate bypass inside src/lib/api.ts itself is allowlisted below.
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "MemberExpression[object.name='NextResponse'][property.name='json']",
        message: "Do not use NextResponse.json in /api/v1 routes. Use apiOk / apiCreated / apiError from @/lib/api so the response envelope stays consistent. For file attachments use `new NextResponse(body, { headers })`.",
      }],
    },
  },
  {
    // Hex-literal allowlist — these files legitimately need raw colors.
    files: [
      "src/components/auth/OAuthButtons.tsx",              // third-party brand SVG marks
      "src/app/(platform)/console/projects/**/BrandingForm.tsx",
      "src/app/(platform)/console/proposals/**/actions.ts",
      "src/app/(platform)/console/proposals/**/edit/page.tsx",
      "src/app/proposals/**",                              // isolated print stylesheet + themed proposal docs
      "src/app/og/route.tsx",                              // Open Graph server route
      "src/app/layout.tsx",                                // themeColor meta
      "src/app/theme/**",                                  // CHROMA BEACON token definitions
    ],
    rules: {
      "no-restricted-syntax": "off",
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
