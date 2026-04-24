// `eslint-config-next` 16 ships flat config natively + already wires
// jsx-a11y. Using FlatCompat here triggers an ESLint 10 circular-JSON
// crash in the diagnostic formatter; redefining the jsx-a11y plugin
// triggers a duplicate-plugin error. Both are bypassed by importing
// the native flat config array and only contributing rule overrides.

import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    rules: {
      // `react/no-unescaped-entities` flags every literal apostrophe + quote in
      // copy. Modern JSX parsers handle them safely. Turned off: 33+ warnings
      // of pure noise that drowned the audit signal.
      "react/no-unescaped-entities": "off",
      // Accessibility — block on serious WCAG violations
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/heading-has-content": "error",
      // Turned off: existing forms use the sibling-label pattern
      // (`<label>X</label><textarea>`) which is screen-reader-accessible
      // via proximity but doesn't carry an explicit htmlFor/id binding.
      // FieldLabel primitive migration is tracked separately.
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "error",

      // React 19 compiler-style rules — these flag patterns that work
      // correctly under our current React 19.2 runtime but are flagged
      // because the upcoming compiler optimizes them differently. Kept
      // as warn so the signal is visible while the codebase migrates
      // off them incrementally.
      // - cascading-renders: setState inside useEffect mirroring a prop
      //   (the "fetch on mount" pattern). Migration target: lazy
      //   `useState(() => …)` initializers or <Suspense> boundaries.
      // - impure-during-render: Date.now()/Math.random() during render.
      //   Safe in server components (single eval per request) but flagged
      //   uniformly by ESLint.
      // - error-boundaries: try/catch wrapping JSX construction. Used
      //   in PDF compile routes where the error pipeline is the
      //   `@react-pdf` renderer's, not React's render boundary.
      // React 19 compiler-style rules downgraded to off — they flag patterns
      // that work correctly under React 19.2 but are noisy in the audit.
      // Re-enable once the compiler ships and we migrate incrementally.
      "react-hooks/error-boundaries": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/incompatible-library": "off",
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
      "src/lib/pdf/**",                                    // @react-pdf/renderer — style objects require hex; no CSS var support
      "src/components/stage-plots/StagePlotCanvas.tsx",    // user-input shape colors; brand-free canvas editor
      "src/app/(platform)/console/settings/branding/**",   // brand-color picker UI — raw hex is the data, not a style
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // `@react-pdf/renderer` Image elements take `src` but no `alt` prop —
    // the renderer ignores it and the rule is about HTML img semantics.
    files: ["src/lib/pdf/**"],
    rules: {
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/anchor-has-content": "off",
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
