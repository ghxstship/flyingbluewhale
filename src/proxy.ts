import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { log, serverTiming } from "@/lib/log";
import { internalPathFor, shellForHost } from "@/lib/urls";

const SUBDOMAINS_ENABLED = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === "1";

// Allow-list of origins permitted to send credentialed cross-origin requests
// to /api/v1. Parsed once at module load. The static header in next.config.ts
// can only emit a single value; this list is matched against `Origin:` per
// request so multi-tenant browser clients (web + portal + mobile shell) all
// work without `*` (which the browser refuses with credentials anyway).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (process.env.NEXT_PUBLIC_APP_URL && !ALLOWED_ORIGINS.includes(process.env.NEXT_PUBLIC_APP_URL)) {
  ALLOWED_ORIGINS.push(process.env.NEXT_PUBLIC_APP_URL);
}

const CORS_ALLOW_METHODS = "GET,POST,PATCH,PUT,DELETE,OPTIONS";
const CORS_ALLOW_HEADERS = "content-type,authorization,x-csrf-token,idempotency-key,x-request-id";

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  // Echo only origins we've allow-listed. Unknown origins get no ACAO header,
  // which is the correct browser behavior for "deny" under credentialed CORS.
  if (!ALLOWED_ORIGINS.includes(origin)) return;
  res.headers.set("access-control-allow-origin", origin);
  res.headers.set("access-control-allow-credentials", "true");
  res.headers.set("vary", "Origin");
}

// Next 16 renamed the `middleware.ts` convention to `proxy.ts` with an
// exported `proxy` function. The runtime behavior is identical; this file
// was moved verbatim to silence the deprecation warning and to avoid
// breaking on the eventual Next 17 removal. `Server-Timing` still uses
// the `mw` tag because that's the observability contract our e2e suite
// + dashboards key on — the file rename is cosmetic, the timing bucket
// is semantic.

const PROTECTED: Array<{ match: RegExp; bucket: keyof typeof RATE_BUDGETS }> = [
  { match: /^\/api\/v1\/ai\//, bucket: "ai" },
  { match: /^\/api\/v1\/tickets\/scan/, bucket: "scan" },
  { match: /^\/api\/v1\/webhooks\//, bucket: "webhook" },
  // Auth bucket protects POST endpoints. Marketing GETs to /login render the form
  // and must not consume the budget — that breaks e2e + real users hitting refresh.
  { match: /^\/api\/v1\/auth\//, bucket: "auth" },
];

// Methods that are subject to rate limiting per bucket. GET to /login etc. is
// exempt because rendering a form is not an attack surface.
const RATE_LIMITED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function newRequestId(): string {
  // nanoid-compatible id w/o dep
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Routes that are served by infrastructure probes (orchestrator, uptime).
// They must not trigger a Supabase session refresh round-trip, otherwise
// the probes can themselves cause database load + false negatives.
const PROBE_PATHS = /^\/api\/v1\/health(?:\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get("x-request-id") ?? newRequestId();
  const startedAt = performance.now();

  // CORS preflight short-circuit — answer OPTIONS before any session refresh
  // or rate-limit accounting. Required for browser fetch() with credentials
  // from any origin in ALLOWED_ORIGINS.
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const res = new NextResponse(null, { status: 204 });
    applyCors(request, res);
    res.headers.set("access-control-allow-methods", CORS_ALLOW_METHODS);
    res.headers.set("access-control-allow-headers", CORS_ALLOW_HEADERS);
    res.headers.set("access-control-max-age", "600");
    res.headers.set("x-request-id", requestId);
    return res;
  }

  if (PROBE_PATHS.test(pathname)) {
    const res = NextResponse.next();
    res.headers.set("x-request-id", requestId);
    applyCors(request, res);
    return res;
  }

  for (const rule of PROTECTED) {
    if (rule.match.test(pathname) && RATE_LIMITED_METHODS.has(request.method)) {
      const budget = RATE_BUDGETS[rule.bucket];
      const key = keyFromRequest(request, `${rule.bucket}:${pathname}`);
      const result = await ratelimit({ key, ...budget });
      if (!result.ok) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        log.warn("ratelimit.blocked", {
          request_id: requestId,
          method: request.method,
          route: pathname,
          bucket: rule.bucket,
          retry_after_s: retryAfterSeconds,
        });
        const res = new NextResponse(
          JSON.stringify({
            ok: false,
            error: {
              code: "rate_limited",
              message: "Too many requests — please try again shortly.",
              bucket: rule.bucket,
              retryAfter: retryAfterSeconds,
            },
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": String(retryAfterSeconds),
              "x-ratelimit-bucket": rule.bucket,
              "x-ratelimit-remaining": "0",
              "x-ratelimit-reset": String(result.resetAt),
              "x-request-id": requestId,
            },
          },
        );
        applyCors(request, res);
        return res;
      }
    }
  }

  // Subdomain → internal route-group rewrite. Public URL stays on the
  // subdomain; Next sees the prefixed path. In path-prefix mode (preview
  // deploys without subdomain DNS) shell is "marketing" and no rewrite
  // happens — the existing /console, /p, /m prefixes already serve the
  // right shell.
  const { shell, tenantSlug } = SUBDOMAINS_ENABLED
    ? shellForHost(request.headers.get("host"))
    : { shell: "marketing" as const, tenantSlug: null as string | null };

  let rewriteUrl: URL | undefined;
  if (SUBDOMAINS_ENABLED && shell !== "marketing") {
    const internal = internalPathFor(shell, request.nextUrl.pathname);
    if (internal !== request.nextUrl.pathname) {
      rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = internal;
    }
  }

  const response = await updateSession(request, rewriteUrl);
  const mwDuration = Math.round((performance.now() - startedAt) * 10) / 10;
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-shell", shell);
  if (tenantSlug) response.headers.set("x-tenant-slug", tenantSlug);
  // Server-Timing is additive — append if the downstream handler already set it.
  const existingTiming = response.headers.get("server-timing");
  response.headers.set(
    "server-timing",
    existingTiming ? `${existingTiming}, ${serverTiming(mwDuration, "mw")}` : serverTiming(mwDuration, "mw"),
  );
  applyCors(request, response as NextResponse);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
