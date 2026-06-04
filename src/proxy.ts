import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { log, serverTiming } from "@/lib/log";
import { internalPathFor, shellForHost } from "@/lib/urls";
import { env, hasSupabase } from "@/lib/env";
import { extractPortalSlug, escapeHtml } from "@/lib/portal-slug";

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
  // Heavy generators — PDFs, GDPR exports, DSAR.
  { match: /^\/api\/v1\/exports\//, bucket: "export" },
  { match: /^\/api\/v1\/me\/export/, bucket: "export" },
  { match: /^\/api\/v1\/privacy\/dsar/, bucket: "export" },
  { match: /^\/api\/v1\/projects\/[^/]+\/(archive|sponsor-deck|wristbands|signage-grid)/, bucket: "export" },
  // High-impact mass notifications.
  { match: /^\/api\/v1\/crisis\//, bucket: "crisis" },
  { match: /^\/api\/v1\/push\//, bucket: "crisis" },
  // Fail-safe for everything else state-changing under /api/v1. Last in the
  // list so the more specific buckets above win the match.
  { match: /^\/api\/v1\//, bucket: "write" },
];

// Public unauthenticated paths — the route handlers verify their own tokens
// (HMAC-signed for /share/[token] from the Phase 3.5 share_links primitive,
// DB-backed for /proposals/[token]). The middleware does NOT require a
// Supabase session for these; do not add any auth-bearing rules that would
// reach them.
//   /^\/share\/[^/]+/        — share_links public landing
//   /^\/proposals\/[^/]+/    — proposal share-token landing

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

  // Match-and-break: PROTECTED is ordered most-specific-first. The catch-all
  // /api/v1/ `write` bucket lives at the bottom so it only triggers when no
  // tighter rule already accounted for the request. Without `break`, an
  // /api/v1/ai/* call would consume both the `ai` and `write` buckets.
  if (RATE_LIMITED_METHODS.has(request.method)) {
    for (const rule of PROTECTED) {
      if (!rule.match.test(pathname)) continue;
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
      break;
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

  // ADR-0009 grace window — role-prefixed mobile aliases.
  //
  // Treat `/m/<role>/<surface>` as an alias of `/m/<surface>` so the
  // canonical pages don't need to be duplicated under every role's
  // namespace just to ship role-routed URLs. Per-role pages still take
  // priority when they exist (e.g. /m/[role] for the role home — Next's
  // static-match-wins-over-dynamic resolves it).
  //
  // Inverts the ADR's planned migration order: the canonical pages
  // remain at /m/<surface>; new role-prefixed URLs are the aliases. The
  // full migration (flip canonical to /m/[role]/<surface>) becomes a
  // dedicated PR once the smoke harness + per-role page bodies land.
  const MOBILE_ROLE_ALIAS = /^\/m\/(performer|crew|driver|medic|guard|admin)\/(.+)$/;
  const targetPath = rewriteUrl?.pathname ?? pathname;
  const aliasMatch = targetPath.match(MOBILE_ROLE_ALIAS);
  if (aliasMatch) {
    const [, , rest] = aliasMatch;
    // Skip the rewrite for `settings/role` — that's the role chooser,
    // which IS a real role-prefixed surface and must not collapse.
    if (rest !== "settings/role") {
      const aliasUrl = rewriteUrl ? new URL(rewriteUrl.toString()) : request.nextUrl.clone();
      aliasUrl.pathname = `/m/${rest}`;
      rewriteUrl = aliasUrl;
    }
  }

  const response = await updateSession(request, rewriteUrl);

  // ────────────────────────────────────────────────────────────────────
  // Portal slug pre-check (Bug #18).
  //
  // Next 16 streaming RSC means a layout-level `notFound()` keeps the
  // response status at 200 if the layout has already started flushing
  // headers — slug enumeration via /p/<unknown>/guide leaks "200 + empty"
  // instead of "404 + missing". We resolve the slug here, before the
  // response stream begins, and short-circuit unknown slugs to a hard 404.
  // The lookup uses an anon-readable RLS policy on `projects` and is
  // bounded by an in-memory negative cache (per edge instance, 60s TTL)
  // to absorb scanner traffic without amplifying DB load.
  // ────────────────────────────────────────────────────────────────────
  const portalPath = pathname.startsWith("/p/")
    ? pathname
    : SUBDOMAINS_ENABLED && shell === "portal" && rewriteUrl?.pathname.startsWith("/p/")
      ? rewriteUrl.pathname
      : null;
  if (portalPath && hasSupabase) {
    const slug = extractPortalSlug(portalPath);
    if (slug && !(await portalSlugExists(request, slug))) {
      const res = new NextResponse(renderPortalSlugNotFound(slug), {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      res.headers.set("x-request-id", requestId);
      res.headers.set("x-shell", shell);
      if (tenantSlug) res.headers.set("x-tenant-slug", tenantSlug);
      return res;
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // MFA gate (Phase 2.5).
  //
  // If the org requires 2FA for the user's role and the current session is
  // single-factor (aal1), bounce them through /mfa/challenge before they can
  // touch protected resources. Skip on:
  //   - public marketing/auth routes (so /login, /signup, the challenge page
  //     itself, etc. all stay reachable)
  //   - /me/security/* (lets users self-rescue + enroll a factor)
  //   - /api/v1/auth/* (auth endpoints must function pre-aal2)
  //   - /api/v1/health (probes)
  //
  // We only run it for authenticated users; unauthenticated requests are
  // rejected by the routes themselves.
  // ────────────────────────────────────────────────────────────────────
  if (await shouldRunMfaGate(pathname)) {
    const redirectUrl = await checkMfaForRequest(request, pathname);
    if (redirectUrl) {
      const res = NextResponse.redirect(redirectUrl);
      // Preserve the request id + shell headers so observability matches.
      res.headers.set("x-request-id", requestId);
      res.headers.set("x-shell", shell);
      if (tenantSlug) res.headers.set("x-tenant-slug", tenantSlug);
      // Carry over Supabase session cookies set by updateSession so the user
      // doesn't get logged out by the redirect.
      response.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value));
      return res;
    }
  }

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

// ────────────────────────────────────────────────────────────────────
// MFA-gate helpers (run inside proxy.ts so they share the Edge runtime
// context — no `server-only` imports, no node:crypto).
// ────────────────────────────────────────────────────────────────────

const MFA_GATE_EXEMPT = [
  /^\/login(?:\/|$)/,
  /^\/signup(?:\/|$)/,
  /^\/forgot-password/,
  /^\/reset-password/,
  /^\/magic-link/,
  /^\/verify-email/,
  /^\/accept-invite/,
  /^\/mfa\/challenge/,
  /^\/auth\//,
  /^\/me\/security(?:\/|$)/,
  /^\/api\/v1\/auth\//,
  /^\/api\/v1\/health/,
  /^\/api\/v1\/webhooks\//,
  // Public share-link landing — token verification + RPC consume run inside
  // the route handler. No Supabase session is expected. (Phase 3.5)
  /^\/share\/[^/]+/,
  // Marketing + portal proposals/offers and other unauthenticated surfaces
  // are gated by their own auth checks; the MFA gate only runs for routes
  // that imply an authenticated session.
];

const MFA_GATE_PROTECTED = [
  /^\/console(?:\/|$)/,
  /^\/me(?!\/security)(?:\/|$)/,
  /^\/p\/[^/]+\/(?!guide$|guide\/)/,
  /^\/m(?:\/|$)/,
];

async function shouldRunMfaGate(pathname: string): Promise<boolean> {
  if (!hasSupabase) return false;
  if (MFA_GATE_EXEMPT.some((rx) => rx.test(pathname))) return false;
  return MFA_GATE_PROTECTED.some((rx) => rx.test(pathname));
}

/**
 * Returns a redirect URL when the request should be intercepted by the MFA
 * gate, or null when the request may proceed.
 */
async function checkMfaForRequest(request: NextRequest, pathname: string): Promise<URL | null> {
  // Build a read-only Supabase client (cookies are already set on the response
  // by updateSession; we only need to *read* them here for getUser).
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null; // unauthenticated — let route handlers decide

  // Resolve role + org for this user. We look up the first non-demo membership
  // (mirrors getSession()'s preference) without pulling the full helper in —
  // server-only imports aren't available here. .is("deleted_at", null) so
  // an offboarded user's soft-deleted membership doesn't bring an old org's
  // MFA-required map into scope.
  const { data: rawMemberships } = await supabase
    .from("memberships")
    .select("org_id, role, orgs(slug)")
    .eq("user_id", userData.user.id)
    .is("deleted_at", null);
  type MembershipRow = { org_id: string; role: string; orgs: { slug: string } | null };
  const memberships = (rawMemberships ?? []) as unknown as MembershipRow[];
  if (memberships.length === 0) return null;
  const real = memberships.find((m) => m.orgs?.slug !== "demo") ?? memberships[0];

  // Lookup the org's MFA-required map.
  const { data: orgRow } = await supabase.from("orgs").select("require_2fa_for").eq("id", real.org_id).maybeSingle();
  const requireMap =
    ((orgRow as { require_2fa_for?: Record<string, boolean> } | null)?.require_2fa_for as
      | Record<string, boolean>
      | undefined) ?? {};
  if (!requireMap[real.role]) return null;

  // Check the current AAL.
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData?.currentLevel === "aal2") return null;

  // Below aal2 → redirect.
  const redirect = new URL("/mfa/challenge", request.url);
  redirect.searchParams.set("next", pathname + (request.nextUrl.search ?? ""));
  return redirect;
}

// ────────────────────────────────────────────────────────────────────
// Portal slug pre-check helpers (Bug #18).
// extractPortalSlug + escapeHtml moved to lib/portal-slug.ts so they're
// covered by unit tests independent of the Edge runtime.
// ────────────────────────────────────────────────────────────────────

// Brand-aligned 404 for unknown portal slugs. Rendered as inline HTML by
// the Edge runtime (no React) because the response is emitted *before*
// Next.js boots the route group — see the pre-check rationale at the
// call site. The palette mirrors ATLVS dark surfaces with the GVTEWAY
// portal accent so the page still reads as "this is part of the same
// product" instead of a bare system-ui error.
function renderPortalSlugNotFound(slug: string): string {
  // Inter (project body font) with a system fallback chain in case the
  // self-hosted font hasn't preloaded — this response is served before
  // the link-rel-preload header for the woff2 file.
  const fontStack = "Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>404 — Portal Not Found · GVTEWAY</title>",
    "<style>",
    `:root{color-scheme:dark}`,
    `html,body{margin:0;padding:0;height:100%;background:#0a0c10;color:#e7e7ec;font-family:${fontStack};-webkit-font-smoothing:antialiased}`,
    `main{min-height:100%;display:flex;align-items:center;justify-content:center;padding:48px 24px}`,
    `.card{max-width:28rem;text-align:center}`,
    `.eyebrow{font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:#5b9dff}`,
    `h1{margin:12px 0 0;font-size:28px;font-weight:600;letter-spacing:-.01em;color:#ffffff}`,
    `p{margin:8px 0 0;font-size:14px;line-height:1.6;color:#a0a4ae}`,
    `code{font-family:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:12px;color:#e7e7ec;background:#161a22;border:1px solid #232936;border-radius:6px;padding:2px 6px}`,
    `.actions{margin-top:24px;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}`,
    `a.btn{display:inline-block;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none;transition:filter .15s ease}`,
    `a.btn:hover{filter:brightness(1.1)}`,
    `a.btn-primary{background:#5b9dff;color:#0a0c10}`,
    `a.btn-secondary{background:transparent;color:#e7e7ec;border:1px solid #2a3142}`,
    "</style>",
    "</head>",
    "<body>",
    "<main>",
    '<div class="card">',
    '<div class="eyebrow">404 · Portal</div>',
    "<h1>Not Found</h1>",
    `<p>No portal exists at <code>/p/${escapeHtml(slug)}/</code>. Check the link or contact the team that shared it.</p>`,
    '<div class="actions">',
    '<a class="btn btn-primary" href="/">Home</a>',
    '<a class="btn btn-secondary" href="/contact">Contact Us</a>',
    "</div>",
    "</div>",
    "</main>",
    "</body>",
    "</html>",
  ].join("");
}

// Per-edge-instance cache. Positive entries get a longer TTL because slugs
// don't get reused; negative entries expire faster so a freshly published
// portal becomes reachable without a deploy.
type SlugCacheEntry = { exists: boolean; expiresAt: number };
const SLUG_CACHE = new Map<string, SlugCacheEntry>();
const SLUG_CACHE_POS_TTL_MS = 5 * 60_000; // 5 min
const SLUG_CACHE_NEG_TTL_MS = 60_000; // 1 min
const SLUG_CACHE_MAX = 1024;

async function portalSlugExists(request: NextRequest, slug: string): Promise<boolean> {
  const now = Date.now();
  const cached = SLUG_CACHE.get(slug);
  if (cached && cached.expiresAt > now) return cached.exists;

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  });
  const { data } = await supabase.from("projects").select("id").eq("slug", slug).is("deleted_at", null).maybeSingle();
  const exists = !!data;

  // Bounded LRU-ish: drop oldest when over cap.
  if (SLUG_CACHE.size >= SLUG_CACHE_MAX) {
    const firstKey = SLUG_CACHE.keys().next().value;
    if (firstKey !== undefined) SLUG_CACHE.delete(firstKey);
  }
  SLUG_CACHE.set(slug, {
    exists,
    expiresAt: now + (exists ? SLUG_CACHE_POS_TTL_MS : SLUG_CACHE_NEG_TTL_MS),
  });
  return exists;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
