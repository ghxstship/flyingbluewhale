import { resolve } from "node:path";
import type { NextConfig } from "next";

// Pin the workspace root so Next/Turbopack stops inferring it from stray
// lockfiles in parent directories (e.g. /Users/.../Documents/package-lock.json).
// Resolving via `process.cwd()` works for both the main checkout and
// git worktrees (`.claude/worktrees/<branch>`) — the closest `node_modules`
// is hoisted to the main checkout, so we walk up to find a directory that
// contains a `node_modules/next` entry.
const workspaceRoot = (() => {
  const { existsSync } = require("node:fs");
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, "node_modules", "next"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
})();

const supabaseHost = (() => {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
    }
  } catch {}
  return "*.supabase.co";
})();

// CORS for /api/* is set per-request in src/proxy.ts so we can match Origin
// against an allow-list (`ALLOWED_ORIGINS`) instead of pinning a single
// hard-coded value here. Browsers reject `Access-Control-Allow-Origin: *`
// on credentialed requests, so static config can't serve a multi-tenant API.

// `unsafe-eval` is needed by Turbopack's dev runtime for HMR; production
// Next.js (App Router + RSC) doesn't require it. Strip it from prod CSP.
const isDev = process.env.NODE_ENV !== "production";
const scriptUnsafe = isDev ? "'unsafe-inline' 'unsafe-eval'" : "'unsafe-inline'";

const csp = [
  `default-src 'self'`,
  // 'unsafe-inline' is required by Next for the theme + SW bootstrap inline
  // scripts in app/layout.tsx. The next-best step would be a per-request
  // nonce via middleware — non-trivial; tracked as a follow-up. Stripe
  // host is needed for Stripe.js; Anthropic streams over fetch (already in
  // connect-src), no script tag.
  `script-src 'self' ${scriptUnsafe} https://js.stripe.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://${supabaseHost} https://*.stripe.com`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.anthropic.com https://api.stripe.com https://*.ingest.sentry.io`,
  // 'self' is required so the home page's same-origin <iframe> live-preview
  // of /p/<slug>/guide loads. Without it, CSP blocks the embed and
  // top-level hydration fails for any client component declared after the
  // failed iframe in the tree (CookieConsent, ShortcutDialog, etc.).
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
  // 'self' permits the marketing home page to embed its own portal-guide
  // iframe (same-origin live preview). External embeds remain blocked, so
  // this is a strict superset of clickjacking protection (X-Frame-Options:
  // SAMEORIGIN equivalent). Cross-origin framing would require explicit
  // host allowlisting here.
  `frame-ancestors 'self'`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
].join("; ");

const config: NextConfig = {
  reactStrictMode: true,
  // react compiler opt-in. In Next 16 the key graduated out of `experimental`
  // to a top-level option; cast guards against type drift if the typing lags
  // the runtime.
  reactCompiler: true as never,
  turbopack: {
    root: workspaceRoot,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          // ACAO/ACAC/ACAM/ACAH are emitted per-request in src/proxy.ts.
        ],
      },
    ];
  },
};

export default config;
