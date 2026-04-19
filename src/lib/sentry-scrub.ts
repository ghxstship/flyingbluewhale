/**
 * Sentry PII scrubber — redacts sensitive strings from events before they
 * leave the process. H2-06 / IK-041.
 *
 * This is a best-effort second line of defense. The primary guarantees are:
 *   1. `sendDefaultPii: false` in Sentry.init — drops IPs + headers by default.
 *   2. The logger never emits PII to begin with (see `src/lib/log.ts`).
 *
 * What we scrub here (defense-in-depth for exception capture):
 *   - UUIDs in URLs → `:uuid`
 *   - Email addresses anywhere in strings → `:email`
 *   - Bearer tokens / Authorization headers → `[REDACTED]`
 *   - JWT-shaped strings (`eyJ…`) → `:jwt`
 *   - Supabase auth cookies (`sb-<ref>-auth-token`) → `[REDACTED]`
 *   - Stripe customer/payment-intent IDs (`cus_…`, `pi_…`) → `:stripe-id`
 *     (These aren't PII under GDPR but correlate to a person; better safe.)
 */

type MaybeString = string | null | undefined;
type Headers = Record<string, unknown> | undefined;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT_RE = /eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/g;
const STRIPE_ID_RE = /\b(cus|pi|ch|in|seti|sub|acct)_[A-Za-z0-9]{14,}\b/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._-]{8,}/gi;

// Headers whose value we blanket-redact. `cookie` is NOT in this set — it's
// handled separately so we can preserve cookie names (`theme=dark`) while
// scrubbing only the sensitive ones (`sb-*-auth-token`).
const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "x-api-key",
  "x-stripe-signature",
  "proxy-authorization",
]);

const SENSITIVE_COOKIE_NAMES = [
  /^sb-[^=]+-auth-token(?:\.0|\.1)?$/i,
  /^__Secure-next-auth\.session-token$/i,
  /^fbw_session$/i,
];

export function scrubString(s: MaybeString): MaybeString {
  if (!s) return s;
  return s
    .replace(UUID_RE, ":uuid")
    .replace(JWT_RE, ":jwt")
    .replace(BEARER_RE, "Bearer [REDACTED]")
    .replace(STRIPE_ID_RE, ":stripe-id")
    .replace(EMAIL_RE, ":email");
}

export function scrubCookieHeader(cookieHeader: MaybeString): MaybeString {
  if (!cookieHeader) return cookieHeader;
  return cookieHeader
    .split(";")
    .map((piece) => {
      const [name, ...rest] = piece.split("=");
      const trimmed = (name ?? "").trim();
      if (!trimmed) return piece;
      if (SENSITIVE_COOKIE_NAMES.some((re) => re.test(trimmed))) {
        return `${trimmed}=[REDACTED]`;
      }
      return `${trimmed}=${rest.join("=")}`;
    })
    .join(";");
}

function scrubHeaders(h: Headers): Headers {
  if (!h || typeof h !== "object") return h;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(h)) {
    const key = k.toLowerCase();
    if (SENSITIVE_HEADER_NAMES.has(key)) {
      out[k] = "[REDACTED]";
    } else if (key === "cookie" && typeof v === "string") {
      out[k] = scrubCookieHeader(v);
    } else if (typeof v === "string") {
      out[k] = scrubString(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Apply to a Sentry `event` inside `beforeSend`. Returns the mutated event.
 * Sentry may also call `beforeSendTransaction` — route that through the
 * same pipeline.
 *
 * Typed as `unknown` at the boundary because Sentry's `ErrorEvent` shape
 * carries many optional fields we don't need to model exhaustively — we
 * access the subset we care about via narrow runtime type guards.
 */
export function scrubSentryEvent<T>(event: T): T {
  const e = event as {
    request?: {
      url?: unknown;
      query_string?: unknown;
      cookies?: unknown;
      headers?: unknown;
    };
    message?: unknown;
    exception?: { values?: Array<{ value?: unknown }> };
    extra?: Record<string, unknown>;
  };

  if (e.request) {
    if (typeof e.request.url === "string") e.request.url = scrubString(e.request.url);
    if (typeof e.request.query_string === "string") e.request.query_string = scrubString(e.request.query_string);
    if (e.request.headers && typeof e.request.headers === "object") {
      e.request.headers = scrubHeaders(e.request.headers as Headers);
    }
    if (typeof e.request.cookies === "string") e.request.cookies = scrubCookieHeader(e.request.cookies);
  }
  if (typeof e.message === "string") e.message = scrubString(e.message);
  if (e.exception?.values) {
    for (const ex of e.exception.values) {
      if (typeof ex.value === "string") ex.value = scrubString(ex.value);
    }
  }
  if (e.extra && typeof e.extra === "object") {
    for (const [k, v] of Object.entries(e.extra)) {
      if (typeof v === "string") e.extra[k] = scrubString(v);
    }
  }
  return event;
}
