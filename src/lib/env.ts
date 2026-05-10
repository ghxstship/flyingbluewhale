import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().or(z.literal("")).default(""),
  // Empty string is allowed for environments that opt out of Supabase
  // (unit-test CI, some preview deploys); hasSupabase guards usage.
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // "1" enables subdomain routing (atlvs.lytehaus.live, gvteway.lytehaus.live,
  // compvss.lytehaus.live). Anything else falls back to path-prefix mode
  // (single-host /console, /p, /m). Vercel preview deploys leave it unset.
  NEXT_PUBLIC_USE_SUBDOMAINS: z.string().optional(),
  // Sentry DSN. NEXT_PUBLIC_ variant is used by the client/edge configs;
  // server config also accepts the non-public form so it's available without
  // a client-visible bundle injection.
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // Feature-flag service (GrowthBook). Server reads GB_HOST + the public
  // client key; both are optional — flags fall back to defaults if unset.
  GROWTHBOOK_API_HOST: z.string().url().optional(),
  NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY: z.string().optional(),
  // External weather provider — flip to "1" to disable (e.g. when the
  // upstream provider is rate-limiting). Empty/unset = enabled.
  WEATHER_DISABLED: z.string().optional(),
  // Logger floor: trace | debug | info | warn | error. Defaults to info.
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).optional(),
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_USE_SUBDOMAINS: process.env.NEXT_PUBLIC_USE_SUBDOMAINS,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  GROWTHBOOK_API_HOST: process.env.GROWTHBOOK_API_HOST,
  NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  WEATHER_DISABLED: process.env.WEATHER_DISABLED,
  LOG_LEVEL: process.env.LOG_LEVEL as "trace" | "debug" | "info" | "warn" | "error" | undefined,
});

// ────────────────────────────────────────────────────────────────────────────
// Startup validation for production — fail fast rather than returning opaque
// 503 errors at request time when a required secret is missing.  We gate on
// NODE_ENV so CI / preview deploys without the full secret set still build.
// ────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const required: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL || undefined],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined],
    ["SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY],
    ["STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY],
    ["STRIPE_WEBHOOK_SECRET", env.STRIPE_WEBHOOK_SECRET],
    ["ANTHROPIC_API_KEY", env.ANTHROPIC_API_KEY],
    ["NEXT_PUBLIC_APP_URL", env.NEXT_PUBLIC_APP_URL],
  ];
  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    // Use console.error rather than throw so the process can still start on
    // Vercel preview deploys that deliberately omit some secrets.  A hard
    // throw would prevent the health-check routes from responding.
    console.error(`[env] Missing required production env vars: ${missing.join(", ")}`);
  }
}

export const hasSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const hasSentry = Boolean(env.NEXT_PUBLIC_SENTRY_DSN);
export const hasResend = Boolean(env.RESEND_API_KEY);
export const hasUpstash = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
export const hasGrowthbook = Boolean(env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY);
export const isWeatherEnabled = !env.WEATHER_DISABLED;
