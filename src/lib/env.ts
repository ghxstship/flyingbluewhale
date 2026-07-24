import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().or(z.literal("")).default(""),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // `.or(z.literal(""))`: tolerate an empty-string env value (CI/Vercel pass ""
  // for unset vars) — `.optional()` alone only admits `undefined`, so a "" would
  // throw "Invalid URL" and fail the production build. Empty = treated as unset.
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
  // "1" enables subdomain routing (app.atlvs.pro, gateway.atlvs.pro,
  // compass.atlvs.pro). Anything else falls back to path-prefix mode
  // (single-host /studio, /p, /m). Vercel preview deploys leave it unset.
  NEXT_PUBLIC_USE_SUBDOMAINS: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  // Svix signing secret for the Resend outbound-events webhook
  // (/api/v1/webhooks/resend) — the `whsec_...` value from the Resend
  // dashboard. Unset = the endpoint answers 503 and delivery/open/bounce
  // signals only advance the funnel via the synchronous send path.
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
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
  // T1-4 kiosk punch mode: server pepper for the worker-PIN lookup digest
  // (HMAC-SHA256(org:pin)). Set in prod via Vercel env; dev uses a
  // deterministic fallback so local PINs survive restarts. Rotating this
  // invalidates every stored digest — workers re-set their PINs.
  KIOSK_PIN_SECRET: z.string().optional(),
  // Speech-to-text for COMPVSS field dictation (T1-3, MOBILE_BEST_PRACTICES
  // Rank 3). The Anthropic SDK has no audio input, so transcription rides a
  // Whisper-compatible HTTP endpoint. OPENAI_API_KEY unset = the dictation
  // affordance stays hidden everywhere (the transcribe route 503s and the
  // kit button renders nothing). TRANSCRIBE_API_URL / TRANSCRIBE_MODEL
  // re-point the same contract at any OpenAI-audio-compatible provider
  // (Groq, Fireworks, a self-hosted whisper.cpp server, …).
  OPENAI_API_KEY: z.string().optional(),
  TRANSCRIBE_API_URL: z.string().url().optional().or(z.literal("")),
  TRANSCRIBE_MODEL: z.string().optional(),
  // Video huddle provider (F6). Both must be set for live media — the
  // provider adapter (src/lib/video/provider.ts) mints the join token from
  // these. Unset = the huddle UI shows a "configure a provider" state
  // instead of a broken join. Provider-agnostic: point URL+KEY at any
  // token-minting endpoint (Daily, LiveKit, 100ms, etc.).
  VIDEO_PROVIDER_URL: z.string().url().optional().or(z.literal("")),
  VIDEO_PROVIDER_KEY: z.string().optional(),
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
  RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  WEATHER_DISABLED: process.env.WEATHER_DISABLED,
  LOG_LEVEL: process.env.LOG_LEVEL as "trace" | "debug" | "info" | "warn" | "error" | undefined,
  GUIDE_ACCESS_SECRET: process.env.GUIDE_ACCESS_SECRET,
  KIOSK_PIN_SECRET: process.env.KIOSK_PIN_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TRANSCRIBE_API_URL: process.env.TRANSCRIBE_API_URL,
  TRANSCRIBE_MODEL: process.env.TRANSCRIBE_MODEL,
  VIDEO_PROVIDER_URL: process.env.VIDEO_PROVIDER_URL,
  VIDEO_PROVIDER_KEY: process.env.VIDEO_PROVIDER_KEY,
});

export const hasSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const hasSentry = Boolean(env.NEXT_PUBLIC_SENTRY_DSN);
export const hasResend = Boolean(env.RESEND_API_KEY);
export const hasUpstash = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
export const isWeatherEnabled = !env.WEATHER_DISABLED;
// F6 — live video media activates only when both provider creds are set.
export const hasVideoProvider = Boolean(env.VIDEO_PROVIDER_URL && env.VIDEO_PROVIDER_KEY);
// T1-3 — field dictation activates only when a transcription key is set.
export const hasTranscription = Boolean(env.OPENAI_API_KEY);
