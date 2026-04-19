import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
    }
  } catch {}
  return "*.supabase.co";
})();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const csp = [
  `default-src 'self'`,
  // Next requires inline for its runtime; Stripe + Anthropic need their hosts
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://${supabaseHost} https://*.stripe.com`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.anthropic.com https://api.stripe.com https://*.ingest.sentry.io`,
  `frame-src https://js.stripe.com https://hooks.stripe.com`,
  `frame-ancestors 'none'`,
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

  async redirects() {
    return [
      { source: "/app/:path*", destination: "/console/:path*", permanent: true },
    ];
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
          { key: "Access-Control-Allow-Origin", value: ALLOWED_ORIGINS[0] ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "content-type,authorization,x-csrf-token" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default config;
