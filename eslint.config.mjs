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
      // AX-7 — interaction/label a11y guardrails re-enabled as warn (not
      // error: existing violations would break CI; warn keeps the signal
      // visible so new code doesn't add more while the backlog burns down).
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/heading-has-content": "error",
      // Warn (not error): legacy forms still use the sibling-label pattern
      // (`<label>X</label><textarea>`). New code should use <FormField> /
      // ui primitives, which carry an explicit htmlFor/id binding.
      // depth 4: the canonical wrapped-checkbox card pattern
      // (`<label><input/><div><div>text</div></div></label>`) nests its
      // text three levels deep — it IS associated; the default depth-2
      // scan just can't see it.
      "jsx-a11y/label-has-associated-control": ["warn", { depth: 4 }],
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "error",

      // Production debug noise — `console.warn` and `console.error` are
      // the canonical observability surfaces (Sentry hooks them); plain
      // `console.log` is debug noise and shouldn't ship.
      "no-console": ["warn", { allow: ["warn", "error", "info", "debug"] }],

      // Every <button> needs an explicit type so it can't accidentally
      // submit a parent <form>. <Button> from @/components/ui defaults
      // to type="button" already.
      "react/button-has-type": "error",

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
      // CHROMA BEACON + MOTION CANON — class-string + literal guardrails.
      // Whitelisted files: brand SVGs, admin color pickers, open graph,
      // isolated print stylesheets. Everything else must consume tokens.
      "no-restricted-syntax": ["warn",
        {
          selector: "JSXAttribute Literal[value=/#[0-9a-fA-F]{3,8}/]",
          message: "Use a CSS variable (--text, --surface, --accent...) instead of a hex literal. If this is a brand SVG or user-input default, add the file to the eslint ignores list.",
        },
        // MOTION CANON — bare `transition` class (no specifier) animates
        // every changing property at Tailwind's default 150ms, ignoring
        // motion tokens and competing with .hover-lift / .press-scale.
        // Replace with `transition-colors` / `transition-transform` /
        // `transition-opacity` / `transition-shadow`, or use the canonical
        // `.hover-lift` / `.press-scale` / `.cta-nudge` utilities.
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)transition(\\s|$)/]",
          message: "Bare `transition` class is too broad. Use `transition-colors`, `transition-transform`, `transition-opacity`, `transition-shadow`, or the .hover-lift / .press-scale / .cta-nudge utilities.",
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(^|\\s)transition(\\s|$)/]",
          message: "Bare `transition` class is too broad. Use `transition-colors`, `transition-transform`, `transition-opacity`, `transition-shadow`, or the .hover-lift / .press-scale / .cta-nudge utilities.",
        },
        // MOTION CANON — `transition-all` animates every property and is
        // almost always wider than intended. The single legitimate use
        // (floating label in Input.tsx) was migrated to an explicit
        // property list. Allowlist that file via inline disable if it
        // ever needs to come back.
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\btransition-all\\b/]",
          message: "`transition-all` animates every property. List the changing properties explicitly: `transition-[prop1,prop2]`, or use a tokenized utility (.hover-lift / .press-scale).",
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\btransition-all\\b/]",
          message: "`transition-all` animates every property. List the changing properties explicitly: `transition-[prop1,prop2]`, or use a tokenized utility (.hover-lift / .press-scale).",
        },
        // FOCUS CANON — keyboard-only focus state must be `focus-visible:`,
        // not `focus:`. The latter fires on click too, which puts the
        // brand ring on every mouse-clicked element. Strip outline-none
        // pairing if present and rely on `focus-ring` / `focus-ring-strong`.
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)focus:[a-z]/]",
          message: "Use `focus-visible:` (keyboard-only) instead of `focus:` so the ring doesn't appear on mouse click. Or use the `.focus-ring` / `.focus-ring-strong` utility.",
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(^|\\s)focus:[a-z]/]",
          message: "Use `focus-visible:` (keyboard-only) instead of `focus:` so the ring doesn't appear on mouse click. Or use the `.focus-ring` / `.focus-ring-strong` utility.",
        },
        // MOTION CANON — `animate-spin` must be wrapped in `motion-safe:`
        // so users with `prefers-reduced-motion` get a static spinner.
        // The `<Spinner>` primitive (src/components/ui/Spinner.tsx) does
        // this for you — prefer it over rolling your own.
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)animate-spin\\b/]",
          message: "Use `motion-safe:animate-spin` so reduced-motion users see a static spinner — or just use `<Spinner>` from @/components/ui.",
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(^|\\s)animate-spin\\b/]",
          message: "Use `motion-safe:animate-spin` so reduced-motion users see a static spinner — or just use `<Spinner>` from @/components/ui.",
        },
      ],
    },
  },
  {
    // TypeScript-only rules — eslint-config-next registers @typescript-eslint
    // as a plugin under `**/*.{ts,tsx}` only, so these rules must be scoped
    // to the same files or ESLint blows up on .js/.mjs configs.
    files: ["**/*.{ts,tsx}"],
    rules: {
      // - explicit `any` is a hatch we accept ONLY for dynamic Supabase
      //   table-name queries (the typed client doesn't accept dynamic
      //   strings). Surfaced as `warn` so each new use is reviewed but
      //   the existing handful don't block CI.
      // - implicit any is already blocked by `strict: true` in tsconfig.
      "@typescript-eslint/no-explicit-any": "warn",
      // Catch unused imports + vars (with `_`-prefix opt-out for params/caught errors).
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
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
      "src/app/opengraph-image.tsx",                       // OG image — ImageResponse runtime has no CSS vars
      "src/app/layout.tsx",                                // themeColor meta
      "src/app/theme/**",                                  // CHROMA BEACON token definitions
      "src/lib/pdf/**",                                    // @react-pdf/renderer — style objects require hex; no CSS var support
      "src/components/stage-plots/StagePlotCanvas.tsx",    // user-input shape colors; brand-free canvas editor
      "src/app/(platform)/console/settings/branding/**",   // brand-color picker UI — raw hex is the data, not a style
      "src/components/charts/**",                          // chart palettes — recharts/maplibre need raw hex
      "src/app/(platform)/console/finance/reports/ReportsCharts.tsx",
      "src/app/(platform)/console/sustainability/carbon/CarbonCharts.tsx",
      "src/app/(platform)/console/production/dispatch/live/LiveDispatchMap.tsx",
      "src/app/(platform)/console/projects/[projectId]/gantt/GanttChart.tsx",
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
    // Explicit-`any` allowlist — files where the escape hatch is intentional
    // and documented at the call site:
    // - `db/resource.ts`: dynamic Supabase table-name queries (typed client
    //   only accepts string-literal table names).
    // - `export/strategies/**`: pluggable export pipeline operating over
    //   heterogeneous JSON shapes from any org-scoped table.
    // - `idempotency.ts`: opaque request-body cache (bytes in, bytes out).
    // - `pdf/deliverables/registry.tsx`, `pptx/sponsor-deck.ts`: third-party
    //   renderer call-sites whose types don't expose the relevant fields.
    // - `usage.ts`: heterogeneous metric payloads.
    // - `ai/extract-credential.ts`: Anthropic SDK content-block union.
    // - `api/v1/exports/route.ts`: dynamic select-* result rows.
    files: [
      "src/lib/db/resource.ts",
      "src/lib/export/strategies/**",
      "src/lib/idempotency.ts",
      "src/lib/pdf/deliverables/registry.tsx",
      "src/lib/pptx/sponsor-deck.ts",
      "src/lib/usage.ts",
      "src/lib/ai/extract-credential.ts",
      "src/app/api/v1/exports/route.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // E2E tests — Playwright diagnostic logging is intentional and surfaces
    // a11y / regression detail in the test reporter.
    files: ["e2e/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // CLI scripts — stdout via console.log IS the program output (smoke
    // harnesses, seeders, i18n tooling). Same rationale as the e2e block.
    files: ["scripts/**/*.{mjs,js,ts}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Edge functions run on Deno — `// deno-lint-ignore-file no-explicit-any`
    // already silences the equivalent rule in the runtime; ESLint's view
    // of these files is informational only.
    files: ["supabase/functions/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      // Claude Code worktrees are full repo copies — linting them doubles
      // (or worse) every run, and they're git-ignored anyway.
      ".claude/**",
      "public/service-worker.js",
      "src/lib/supabase/database.types.ts",
      // Ambient declaration files — type-only, not lintable as source.
      "**/*.d.ts",
      "**/*.d.mts",
    ],
  },
];

export default config;
