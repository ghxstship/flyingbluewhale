import { resolve } from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { buildCsp } from "./src/lib/csp";

// Pin the workspace root so Next/Turbopack stops inferring it from stray
// lockfiles in parent directories (e.g. /Users/.../Documents/package-lock.json).
// We prefer the project directory itself (`process.cwd()`) because Turbopack
// treats `root` as the filesystem boundary for resolution; if the root sits
// above the project, relative `@import "./..."` resolution in CSS files
// silently truncates. Only walk up if the project directory has no
// `node_modules` — that happens in git worktrees that haven't run `npm
// install` (the worktree leans on the main checkout's hoisted modules).
const workspaceRoot = (() => {
  const { existsSync } = require("node:fs");
  const here = process.cwd();
  if (existsSync(resolve(here, "node_modules", "next"))) return here;
  let dir = here;
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, "node_modules", "next"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return here;
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

const isDev = process.env.NODE_ENV !== "production";

// Static fallback CSP — applied to responses that bypass middleware (static
// assets the proxy matcher excludes). The canonical *document* CSP carries a
// per-request nonce and is emitted from src/proxy.ts (see src/lib/csp.ts) so
// the inline bootstrap scripts in app/layout.tsx run under `script-src
// 'nonce-<n>'` WITHOUT 'unsafe-inline'. Building this from the same helper
// (no nonce) keeps the two policies in lockstep — in prod the static fallback
// keeps 'unsafe-inline' ONLY as a degraded path for un-nonced static
// responses; every HTML document gets the stricter nonce'd policy from
// middleware, which overrides this header value.
const csp = buildCsp({ isDev });

const config: NextConfig = {
  reactStrictMode: true,
  // react compiler opt-in. In Next 16 the key graduated out of `experimental`
  // to a top-level option; cast guards against type drift if the typing lags
  // the runtime.
  reactCompiler: true as never,
  turbopack: {
    root: workspaceRoot,
  },

  // Remote image optimization — user-generated imagery (org logos, portal
  // branding, incident photos, avatars) lives in Supabase storage. Without
  // remotePatterns, next/image can't serve those hosts and surfaces fell
  // back to raw <img> with no resizing/AVIF.
  images: {
    // supabaseHost resolves to the project host (e.g. xyz.supabase.co)
    // when the env is set, else the "*.supabase.co" wildcard — both are
    // valid remotePatterns hostnames.
    remotePatterns: [{ protocol: "https" as const, hostname: supabaseHost }],
  },

  // Server-only document generators — keep them out of the bundled server
  // chunks (they're large, CJS-heavy, and only ~20 API routes touch them).
  // Trims build time and serverless cold starts.
  serverExternalPackages: ["exceljs", "@react-pdf/renderer", "pptxgenjs", "archiver"],

  // ADR-0011 — the operator console moved from /console to /studio. Keep every
  // legacy /console/* URL reachable with a permanent redirect (≥1 release).
  // Applies in path-prefix mode (preview deploys) + any stale external link;
  // in subdomain mode app.atlvs.pro host-rewrites straight to /studio.
  async redirects() {
    return [
      { source: "/console", destination: "/studio", permanent: true },
      { source: "/console/:path*", destination: "/studio/:path*", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // SAMEORIGIN (not DENY) so the marketing home's same-origin
          // <iframe src="/p/<slug>/guide"> live preview can render. The
          // stricter CSP `frame-ancestors 'self'` above is the canonical
          // anti-clickjacking lever; this header is the back-compat
          // shim for browsers that pre-date CSP frame-ancestors. Both
          // must agree on "same-origin only" or the older header
          // overrides and you get a blank iframe.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
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

// Sentry — wrap the config so prod builds upload source maps, turning the
// minified client/server bundles into readable stack traces in the Sentry UI.
// Source-map upload requires SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT
// in the CI build env; when the token is absent the plugin warns and skips
// upload (the build still succeeds), so local + preview builds are unaffected.
// `deleteSourcemapsAfterUpload` (the v10 successor to `hideSourceMaps`) strips
// the generated .map files from the served client bundle after upload so we
// don't leak source to the browser. `disableLogger` tree-shakes the SDK's
// internal logger out of the production bundle.
export default withSentryConfig(config, {
  // Read from env so secrets never live in the repo. `silent` keeps the
  // build log quiet locally; CI sets the token and gets full upload logs.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // Tree-shake the SDK's internal debug logger from the prod bundle. The
  // non-deprecated successor (`webpack.treeshake.removeDebugLogging`) is a
  // no-op under Turbopack (which this build uses) and is not on the public
  // SentryBuildOptions type, so we keep the still-valid `disableLogger`; it
  // emits a benign deprecation warning under Turbopack but is harmless.
  disableLogger: true,
  // Don't fail the build if the auth token is missing (local/preview) — warn
  // and skip the upload step instead of throwing and stopping the bundle.
  errorHandler: (err) => {
    console.warn("[sentry] source-map upload skipped:", err.message);
  },
});
