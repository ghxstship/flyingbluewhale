/**
 * Shell → URL routing.
 *
 * Single source of truth for which shell lives at which subdomain (or path
 * prefix in fallback mode). All cross-shell links MUST go through `urlFor`
 * so the apex/subdomain decision flips in exactly one place.
 *
 * ## `/me` vs `/p/[slug]` boundary (ADR-0010 §Move 3)
 *
 * Cross-project, identity-scoped surfaces live in `/me`. Project-scoped
 * engagement lives in `/p/[slug]`. Rule: if the data answer changes per
 * project, it belongs in `/p/[slug]`; otherwise it belongs in `/me`.
 *
 *   - Talent EPK / resume / ratings rollup → `/me/talent`
 *   - Marketplace applications across all projects → `/me/applications`
 *   - Application detail for a specific project → `/p/[slug]/apply/[id]`
 *   - Cross-project event log → `/me/notifications`
 *   - Conversation with a project's account manager → `/p/[slug]/messages`
 *
 * Modes:
 *   - Subdomain mode (NEXT_PUBLIC_USE_SUBDOMAINS=1):
 *       atlvs.pro                → marketing / auth / personal
 *       app.atlvs.pro            → platform (rewrites to /studio/*)
 *       gvteway.atlvs.pro        → portal   (rewrites to /p/*)
 *       compvss.atlvs.pro        → mobile   (rewrites to /m/*)
 *       legend.atlvs.pro         → legend   (rewrites to /legend/*; the
 *                                  root lands on /legend/hub — bare /legend
 *                                  is the marketing shell's product page)
 *
 *     ATLVS is the parent brand; the operator console lives at `app.` (the
 *     Linear/Notion/Slack pattern) rather than `atlvs.atlvs.pro`. Portal and
 *     mobile keep their function-named subdomains so they each get their own
 *     cookie scope, PWA service-worker origin, and CSP envelope.
 *
 *   - Path-prefix fallback (Vercel previews, plain localhost):
 *       single base URL with /studio, /p, /m path prefixes (legacy layout).
 *
 * Future hook for tenant-specific portal subdomains is wired in
 * `shellForHost` — see the commented branch.
 */
import { env } from "./env";

export type Shell = "marketing" | "auth" | "personal" | "platform" | "portal" | "mobile" | "legend";

const SHELL_SUBDOMAIN: Record<Shell, string | null> = {
  marketing: null,
  auth: null,
  personal: null,
  platform: "app",
  portal: "gvteway",
  mobile: "compvss",
  // ADR-0011 — LEG3ND graduates to its own shell at the real-word `legend`
  // subdomain. (The gvteway→gateway / compvss→compass real-word migration of
  // the existing shells is a separate addressing change applied with Vercel.)
  legend: "legend",
};

const SHELL_PATH_PREFIX: Record<Shell, string> = {
  marketing: "",
  auth: "",
  personal: "",
  platform: "/studio",
  portal: "/p",
  mobile: "/m",
  legend: "/legend",
};

const FALLBACK_BASE = "http://localhost:3000";

const SUBDOMAINS_ENABLED = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === "1";

function apexBase(): string {
  // `||` (not `??`): an empty-string env (CI/Vercel pass "" for unset vars)
  // must fall back too, else `new URL(apexBase())` throws and breaks the build.
  return (env.NEXT_PUBLIC_APP_URL || FALLBACK_BASE).replace(/\/$/, "");
}

function apexParts(): { protocol: string; host: string } {
  try {
    const u = new URL(apexBase());
    return { protocol: u.protocol, host: u.host };
  } catch {
    return { protocol: "http:", host: "localhost:3000" };
  }
}

export function baseUrlFor(shell: Shell): string {
  const subdomain = SHELL_SUBDOMAIN[shell];
  if (SUBDOMAINS_ENABLED && subdomain) {
    const { protocol, host } = apexParts();
    return `${protocol}//${subdomain}.${host}`;
  }
  return apexBase();
}

/**
 * Build an absolute URL for a path inside `shell`. Examples:
 *   urlFor("platform", "/projects/abc")   // https://app.atlvs.pro/projects/abc
 *   urlFor("portal", "/mmw26-hialeah/guide")
 *   urlFor("auth", "/login")              // https://atlvs.pro/login
 */
export function urlFor(shell: Shell, path: string = ""): string {
  const base = baseUrlFor(shell);
  const subdomain = SHELL_SUBDOMAIN[shell];
  // In subdomain mode the shell prefix is "consumed" by the host; in fallback
  // mode it lives in the path.
  const prefix = SUBDOMAINS_ENABLED && subdomain ? "" : SHELL_PATH_PREFIX[shell];
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${prefix}${normalized}`;
}

/**
 * Resolve a stored in-app href (e.g. `notifications.href`, push/email deep
 * links — written as internal route-group paths like `/studio/finance/...`)
 * to an absolute URL on the shell that owns the path.
 *
 * Stored data keeps the internal path shape; every RENDERER of a stored
 * href must route it through this helper so the click lands on the shell's
 * canonical origin (app./gvteway./compvss. in subdomain mode) instead of
 * being served raw off whichever shell rendered it. Absolute URLs pass
 * through untouched. Prefix matching is exact-segment (`/m` or `/m/...`),
 * so `/me/...` and `/marketplace/...` correctly fall through to the apex.
 */
export function resolveNotificationHref(href: string): string {
  if (/^https?:\/\//.test(href)) return href;
  const owns = (prefix: string) => href === prefix || href.startsWith(`${prefix}/`);
  if (owns("/studio")) return urlFor("platform", href.slice("/studio".length));
  if (owns("/legend")) return urlFor("legend", href.slice("/legend".length));
  if (owns("/m")) return urlFor("mobile", href.slice("/m".length));
  if (owns("/p")) return urlFor("portal", href.slice("/p".length));
  // Apex shells (marketing / auth / personal) share the bare origin.
  return urlFor("marketing", href);
}

/**
 * Convert an incoming public path (as the user types it, with the shell
 * subdomain) into the internal route-group path the Next.js app router
 * expects. Used by the root middleware.
 *
 * Path-prefix mode is a no-op (the prefix is already in the path).
 */
export function internalPathFor(shell: Shell, requestPath: string): string {
  const prefix = SHELL_PATH_PREFIX[shell];
  if (!prefix) return requestPath;
  // /api routes are shared across all shells — never prefix them, otherwise a
  // portal-side `fetch("/api/v1/...")` becomes /p/api/v1/... and 404s. The
  // same applies to Next's internal asset paths.
  if (
    requestPath.startsWith("/api/") ||
    requestPath === "/api" ||
    requestPath.startsWith("/_next/") ||
    requestPath.startsWith("/.well-known/")
  ) {
    return requestPath;
  }
  if (requestPath === prefix || requestPath.startsWith(`${prefix}/`)) return requestPath;
  // Cross-shell deep-links: a path that already carries ANOTHER shell's
  // route-group prefix (e.g. `/legend/...` clicked from the app host, or a
  // `/studio/...` link on the legend host) is served by that group directly —
  // never re-prefix it (that would 404, e.g. `/studio/legend/...`). This is
  // what lets the platform Knowledge rail deep-link into the LEG3ND shell.
  for (const other of ["/studio", "/p", "/m", "/legend"]) {
    if (other !== prefix && (requestPath === other || requestPath.startsWith(`${other}/`))) return requestPath;
  }
  // Subdomain roots land on the shell's home surface. For LEG3ND that is
  // /legend/hub, NOT the bare /legend: since the 2026-07-24 shell
  // normalization the bare path is the (marketing) shell's product page
  // (matching /atlvs, /compvss, /gvteway), so legend.atlvs.pro/ must skip
  // past it into the app. Every other shell's prefix IS its home.
  if (requestPath === "/") return shell === "legend" ? `${prefix}/hub` : prefix;
  return `${prefix}${requestPath}`;
}

/**
 * Resolve a request hostname to the shell that should serve it.
 *
 * Hosts not matching any configured subdomain (and not the apex) fall through
 * to "marketing" — they'll hit the marketing layout, which 404s for unknown
 * paths.
 */
export function shellForHost(host: string | null | undefined): {
  shell: Shell;
  tenantSlug: string | null;
} {
  if (!host) return { shell: "marketing", tenantSlug: null };

  const bareHost = host.split(":")[0]!.toLowerCase();
  const bareApex = apexParts().host.split(":")[0]!.toLowerCase();

  // Exact apex (or www.apex) → marketing/auth/personal share this host.
  if (bareHost === bareApex || bareHost === `www.${bareApex}`) {
    return { shell: "marketing", tenantSlug: null };
  }

  if (!bareHost.endsWith(`.${bareApex}`)) {
    return { shell: "marketing", tenantSlug: null };
  }

  const sub = bareHost.slice(0, bareHost.length - bareApex.length - 1);

  // Future hook: peel `[slug].gvteway.atlvs.pro` so the portal can offer
  // per-tenant subdomains without touching call sites. The middleware will
  // forward `tenantSlug` via a request header so portal routes can inject
  // it into params alongside the existing `[slug]` segment. Same hook
  // applies to `[slug].app.atlvs.pro` for tenant-scoped console hosts and
  // to custom-domain CNAMEs (portal.{tenantbrand}.com → gvteway.atlvs.pro)
  // that resolve their org by request header.
  //
  // const parts = sub.split(".");
  // if (parts.length === 2 && parts[1] === "gvteway") {
  //   return { shell: "portal", tenantSlug: parts[0] };
  // }

  if (sub === "app") return { shell: "platform", tenantSlug: null };
  // Both the real-word (IMPLEMENTATION §2 — `gateway`/`compass`) and the legacy
  // stylized (`gvteway`/`compvss`) host spellings resolve, so the DNS/Vercel
  // cutover can land either spelling without a code change. The URL helper
  // still EMITS the current spelling (SHELL_SUBDOMAIN) until that flip.
  if (sub === "gvteway" || sub === "gateway") return { shell: "portal", tenantSlug: null };
  if (sub === "compvss" || sub === "compass") return { shell: "mobile", tenantSlug: null };
  if (sub === "legend") return { shell: "legend", tenantSlug: null };

  return { shell: "marketing", tenantSlug: null };
}

/**
 * Map the internal `resolveShell()` route-prefix return value to the
 * `Shell` discriminator used by `urlFor()`. The two encodings exist
 * because `resolveShell()` is consumed by middleware (path-based) and
 * `Shell` is consumed by URL-building (subdomain-aware); this helper
 * is the single bridge. Used by /auth/resolve to dispatch the
 * post-login redirect.
 */
export function shellFromResolved(resolved: "/studio" | "/p" | "/m" | "/me"): Shell {
  switch (resolved) {
    case "/studio":
      return "platform";
    case "/p":
      return "portal";
    case "/m":
      return "mobile";
    case "/me":
      return "personal";
  }
}

/** Test/debug introspection — exported only to make the constants exercisable. */
export const __internals = { SHELL_SUBDOMAIN, SHELL_PATH_PREFIX, SUBDOMAINS_ENABLED };
