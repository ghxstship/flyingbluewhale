import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().or(z.literal("")).default(""),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // "1" enables subdomain routing (atlvs.flytehaus.live, gvteway.flytehaus.live,
  // compvss.flytehaus.live). Anything else falls back to path-prefix mode
  // (single-host /console, /p, /m). Vercel preview deploys leave it unset.
  NEXT_PUBLIC_USE_SUBDOMAINS: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
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
  // HMAC secret for signing the public-link-plus-code guide-access cookie.
  // Set in prod via Vercel env; in dev a deterministic fallback is used so
  // local cookies survive process restarts. Rotating this value revokes
  // every outstanding access token.
  GUIDE_ACCESS_SECRET: z.string().optional(),
  // Web Push (VAPID). Generate with: npx web-push generate-vapid-keys
  VAPID_SUBJECT: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  // HMAC secret for /share/[token] public link signing. Rotating invalidates
  // every outstanding /share/* URL. Generate: openssl rand -base64 32
  SHARE_LINK_SECRET: z.string().optional(),
  // Slack integration (OAuth app credentials + signing secret).
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  // Internal automation worker bearer token. Guards /api/v1/internal/*.
  JOB_WORKER_TOKEN: z.string().optional(),
  // Cloudflare Turnstile bot-protection secret (public forms).
  TURNSTILE_SECRET_KEY: z.string().optional(),
  // Cloudflare Turnstile site key — sent to the browser.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
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
  GUIDE_ACCESS_SECRET: process.env.GUIDE_ACCESS_SECRET,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  SHARE_LINK_SECRET: process.env.SHARE_LINK_SECRET,
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
  JOB_WORKER_TOKEN: process.env.JOB_WORKER_TOKEN,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});

export const hasSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const hasSentry = Boolean(env.NEXT_PUBLIC_SENTRY_DSN);
export const hasResend = Boolean(env.RESEND_API_KEY);
export const hasUpstash = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
export const hasGrowthbook = Boolean(env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY);
export const isWeatherEnabled = !env.WEATHER_DISABLED;
export const hasVapid = Boolean(env.VAPID_SUBJECT && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
export const hasSlack = Boolean(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET);
export const hasTurnstile = Boolean(env.TURNSTILE_SECRET_KEY);
