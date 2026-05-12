/**
 * Shell → URL routing.
 *
 * Single source of truth for which shell lives at which subdomain (or path
 * prefix in fallback mode). All cross-shell links MUST go through `urlFor`
 * so the apex/subdomain decision flips in exactly one place.
 *
 * Modes:
 *   - Subdomain mode (NEXT_PUBLIC_USE_SUBDOMAINS=1):
 *       lytehaus.live            → marketing / auth / personal
 *       atlvs.lytehaus.live      → platform (rewrites to /console/*)
 *       gvteway.lytehaus.live    → portal   (rewrites to /p/*)
 *       compvss.lytehaus.live    → mobile   (rewrites to /m/*)
 *
 *   - Path-prefix fallback (Vercel previews, plain localhost):
 *       single base URL with /console, /p, /m path prefixes (legacy layout).
 *
 * Future hook for tenant-specific portal subdomains is wired in
 * `shellForHost` — see the commented branch.
 */
import { env } from "./env";

export type Shell = "marketing" | "auth" | "personal" | "platform" | "portal" | "mobile";

const SHELL_SUBDOMAIN: Record<Shell, string | null> = {
  marketing: null,
  auth: null,
  personal: null,
  platform: "atlvs",
  portal: "gvteway",
  mobile: "compvss",
};

const SHELL_PATH_PREFIX: Record<Shell, string> = {
  marketing: "",
  auth: "",
  personal: "",
  platform: "/console",
  portal: "/p",
  mobile: "/m",
};

const FALLBACK_BASE = "http://localhost:3000";

const SUBDOMAINS_ENABLED = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === "1";

function apexBase(): string {
  return (env.NEXT_PUBLIC_APP_URL ?? FALLBACK_BASE).replace(/\/$/, "");
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
 *   urlFor("platform", "/projects/abc")   // https://atlvs.lytehaus.live/projects/abc
 *   urlFor("portal", "/mmw26-hialeah/guide")
 *   urlFor("auth", "/login")              // https://lytehaus.live/login
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
  if (requestPath === "/") return prefix;
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

  const bareHost = host.split(":")[0].toLowerCase();
  const bareApex = apexParts().host.split(":")[0].toLowerCase();

  // Exact apex (or www.apex) → marketing/auth/personal share this host.
  if (bareHost === bareApex || bareHost === `www.${bareApex}`) {
    return { shell: "marketing", tenantSlug: null };
  }

  if (!bareHost.endsWith(`.${bareApex}`)) {
    return { shell: "marketing", tenantSlug: null };
  }

  const sub = bareHost.slice(0, bareHost.length - bareApex.length - 1);

  // Future hook: peel `[slug].gvteway.lytehaus.live` so the portal can offer
  // per-tenant subdomains without touching call sites. The middleware will
  // forward `tenantSlug` via a request header so portal routes can inject
  // it into params alongside the existing `[slug]` segment.
  //
  // const parts = sub.split(".");
  // if (parts.length === 2 && parts[1] === "gvteway") {
  //   return { shell: "portal", tenantSlug: parts[0] };
  // }

  if (sub === "atlvs") return { shell: "platform", tenantSlug: null };
  if (sub === "gvteway") return { shell: "portal", tenantSlug: null };
  if (sub === "compvss") return { shell: "mobile", tenantSlug: null };

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
export function shellFromResolved(resolved: "/console" | "/p" | "/m" | "/me"): Shell {
  switch (resolved) {
    case "/console":
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
