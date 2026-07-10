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
        // GRID CANON — Tailwind arbitrary SPACING values (`mt-[6px]`, `left-[15px]`,
        // `ms-[18px]`, `start-[7px]`, `translate-x-[1.125rem]`…) bypass the 4px ramp.
        // Use a scale utility (`mt-2`, `left-4`, `gap-3`, `translate-x-4`) or, for
        // a one-off, a token: `p-[var(--p-3)]`. Sizing/type arbitraries (`w-[160px]`,
        // `text-[11px]`) are unaffected; `9999px` (off-screen idiom) is allowlisted.
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(?:^|[\\s:])-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|scroll-[pm][xytrbl]?|translate-[xy])-\\[(?!9999px\\])-?\\d+(?:\\.\\d+)?(?:px|rem)\\]/]",
          message: "Off-grid Tailwind arbitrary spacing. Snap to a 4px-scale utility (mt-2, gap-3, left-4) or a token (p-[var(--p-3)]). See MIGRATION.md remap.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(?:^|[\\s:])-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|scroll-[pm][xytrbl]?|translate-[xy])-\\[(?!9999px\\])-?\\d+(?:\\.\\d+)?(?:px|rem)\\]/]",
          message: "Off-grid Tailwind arbitrary spacing. Snap to a 4px-scale utility (mt-2, gap-3, left-4) or a token (p-[var(--p-3)]). See MIGRATION.md remap.",
        },
        // I18N SSOT (AUDIT F-05) — `toLocaleDateString` / `toLocaleTimeString` /
        // `toLocaleString` hardcode the runtime locale/timezone and bypass the
        // i18n SSOT. Use the formatters in src/lib/i18n/format.ts (formatDate /
        // formatDateTime / formatTime / formatDateParts / formatNumber /
        // formatMoney), or the pre-bound `await getRequestFormatters()`
        // (@/lib/i18n/request, Server Components) / `useFormatters()`
        // (@/lib/i18n/LocaleProvider, client components). The implementation
        // itself (src/lib/i18n/**) is allowlisted below.
        {
          selector: "CallExpression[callee.property.name='toLocaleDateString']",
          message: "Locale-fixed date formatting. Use formatDate / formatDateParts from @/lib/i18n/format, or fmt.date / fmt.dateParts via getRequestFormatters() (server) / useFormatters() (client).",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleTimeString']",
          message: "Locale-fixed time formatting. Use formatTime / formatDateParts from @/lib/i18n/format, or fmt.time / fmt.dateParts via getRequestFormatters() (server) / useFormatters() (client).",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleString']",
          message: "Locale-fixed formatting. Dates: formatDateTime / formatDateParts; numbers: formatNumber / formatMoney — from @/lib/i18n/format, or the pre-bound getRequestFormatters() (server) / useFormatters() (client).",
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
      // NOTE: this scoped assignment REPLACES the base no-restricted-syntax
      // array for api files, so the i18n selectors are repeated here.
      "no-restricted-syntax": ["error", {
        selector: "MemberExpression[object.name='NextResponse'][property.name='json']",
        message: "Do not use NextResponse.json in /api/v1 routes. Use apiOk / apiCreated / apiError from @/lib/api so the response envelope stays consistent. For file attachments use `new NextResponse(body, { headers })`.",
      },
      // I18N SSOT (AUDIT F-05) — same guard as the base block (see above).
      {
        selector: "CallExpression[callee.property.name='toLocaleDateString']",
        message: "Locale-fixed date formatting. Use formatDate / formatDateParts from @/lib/i18n/format, or fmt.date / fmt.dateParts via getRequestFormatters().",
      },
      {
        selector: "CallExpression[callee.property.name='toLocaleTimeString']",
        message: "Locale-fixed time formatting. Use formatTime / formatDateParts from @/lib/i18n/format, or fmt.time / fmt.dateParts via getRequestFormatters().",
      },
      {
        selector: "CallExpression[callee.property.name='toLocaleString']",
        message: "Locale-fixed formatting. Dates: formatDateTime / formatDateParts; numbers: formatNumber / formatMoney — from @/lib/i18n/format, or getRequestFormatters().",
      }],
    },
  },
  {
    // Hex-literal allowlist — these files legitimately need raw colors.
    files: [
      "src/components/auth/OAuthButtons.tsx",              // third-party brand SVG marks
      "src/app/(platform)/studio/projects/**/BrandingForm.tsx",
      "src/app/(platform)/studio/proposals/**/actions.ts",
      "src/app/(platform)/studio/proposals/**/edit/page.tsx",
      "src/app/proposals/**",                              // isolated print stylesheet + themed proposal docs
      "src/app/og/route.tsx",                              // Open Graph server route
      "src/app/opengraph-image.tsx",                       // OG image — ImageResponse runtime has no CSS vars
      "src/app/layout.tsx",                                // themeColor meta
      "src/app/theme/**",                                  // CHROMA BEACON token definitions
      "src/lib/pdf/**",                                    // @react-pdf/renderer — style objects require hex; no CSS var support
      "src/components/stage-plots/StagePlotCanvas.tsx",    // user-input shape colors; brand-free canvas editor
      "src/app/(platform)/studio/settings/branding/**",    // brand-color picker UI — raw hex is the data, not a style
      "src/components/charts/**",                          // chart palettes — recharts/maplibre need raw hex
      "src/app/(platform)/studio/finance/reports/ReportsCharts.tsx",
      "src/app/(platform)/studio/sustainability/carbon/CarbonCharts.tsx",
      "src/app/(platform)/studio/production/dispatch/live/LiveDispatchMap.tsx",
      "src/app/(platform)/studio/projects/[projectId]/gantt/GanttChart.tsx",
      "src/components/mobile/kit/RoseCard.tsx",            // Rose ID-card artwork — fixed gradients + white QR quiet zone
      "src/components/mobile/onboarding/CompvssOnboarding.tsx", // Google/Bluesky brand SVGs + Rose card artwork + QR contrast pair
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // I18N SSOT allowlist — the formatter implementation is the ONE place
    // allowed to touch Intl/locale primitives directly (it also carries the
    // guarded `toLocale*` mentions in its own docs/tests). Everything else
    // goes through @/lib/i18n/format / getRequestFormatters / useFormatters.
    // NOTE: src/components/ui/MoneyInput.tsx is also intentionally
    // locale-fixed (en-US parse/format roundtrip) — it carries targeted
    // inline disables rather than a whole-file exemption so the CHROMA /
    // MOTION selectors in the same rule keep applying to it.
    files: ["src/lib/i18n/**"],
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
    // no-restricted-syntax off: the CHROMA/MOTION selectors are JSX-only and
    // the i18n toLocale* guard targets app code — scripts run outside the
    // request/locale context (export-offer-letters.mjs et al are en-US
    // artifacts by design).
    files: ["scripts/**/*.{mjs,js,ts}"],
    rules: {
      "no-console": "off",
      "no-restricted-syntax": "off",
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
