import "server-only";
import { redirect } from "next/navigation";
import { apiError } from "./api";
import { createClient } from "./supabase/server";
import { hasSupabase } from "./env";
import type { Persona, PlatformRole, Tier } from "./supabase/types";

// AsyncLocalStorage isn't viable across Edge runtimes, so we resolve PAT auth
// lazily by inspecting the *current* request's Authorization header from the
// ambient request scope. Next 16 exposes this via the experimental import; we
// fall back to a no-op when it's unavailable (e.g. unit tests using the
// helpers without a request context).
async function readAuthorizationHeader(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return h.get("authorization");
  } catch {
    return null;
  }
}

export type Session = {
  userId: string;
  email: string;
  orgId: string;
  role: PlatformRole;
  tier: Tier;
  persona: Persona;
};

export async function getSession(): Promise<Session | null> {
  if (!hasSupabase) return null;

  // Bearer-token auth (personal access tokens) takes priority over the
  // session cookie when both are present. This mirrors Stripe / GitHub:
  // a token explicitly attached by the caller is the strongest signal of
  // intent, and it lets a developer test a token from a logged-in browser
  // without first signing out.
  const authHeader = await readAuthorizationHeader();
  if (authHeader && /^Bearer\s+pat_/i.test(authHeader)) {
    const { verifyApiKey } = await import("./api-keys");
    const tokenSession = await verifyApiKey(authHeader);
    if (tokenSession) return tokenSession;
    // Fall through to cookie auth so a stale token doesn't lock a logged-in
    // user out of the same request — the cookie is still trustworthy.
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id,role,orgs(tier)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return {
      userId: user.id,
      email: user.email ?? "",
      orgId: "",
      role: "community",
      tier: "access",
      persona: "visitor",
    };
  }

  const role = membership.role as PlatformRole;
  const tier = (membership.orgs as unknown as { tier: Tier } | null)?.tier ?? "access";
  return {
    userId: user.id,
    email: user.email ?? "",
    orgId: membership.org_id,
    role,
    tier,
    persona: personaForRole(role),
  };
}

export async function requireSession(redirectTo = "/login"): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(redirectTo);
  return s;
}

export async function withAuth<T>(handler: (session: Session) => Promise<T>): Promise<T | Response> {
  const session = await getSession();
  if (!session) return apiError("unauthorized", "Authentication required");
  return handler(session);
}

export function personaForRole(role: PlatformRole): Persona {
  switch (role) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "controller":
      return "controller";
    case "collaborator":
      return "project_manager";
    case "contractor":
      return "vendor";
    case "crew":
      return "crew";
    case "client":
      return "client";
    case "developer":
      return "developer";
    case "viewer":
    case "community":
    default:
      return "guest";
  }
}

export function resolveShell(persona: Persona): "/console" | "/p" | "/m" | "/me" {
  if (["owner", "admin", "controller", "project_manager", "developer"].includes(persona)) return "/console";
  // Portal personas need a project slug; guest-by-role (viewer/community) arrives
  // with no slug context, so they go to /me instead of dead-ending on /p/select.
  if (["client", "vendor", "artist", "sponsor"].includes(persona)) return "/p";
  if (persona === "crew") return "/m";
  return "/me";
}

const CAPABILITIES: Partial<Record<PlatformRole, readonly string[]>> = {
  owner: ["*"],
  admin: ["*"],
  controller: [
    "projects:read",
    "projects:write",
    "invoices:*",
    "expenses:*",
    "budgets:*",
    "time:*",
    "mileage:*",
    "payouts:*",
    "procurement:*",
    "billing:*",
  ],
  collaborator: [
    "projects:read",
    "projects:write",
    "tasks:*",
    "schedule:*",
    "crew:read",
    "proposals:*",
    "clients:read",
  ],
  contractor: ["projects:read", "tasks:read", "time:write", "vendor-portal:*"],
  crew: ["projects:read", "tasks:read", "time:write", "check-in:*"],
  client: ["client-portal:*"],
  viewer: ["projects:read"],
  developer: ["*"],
  community: [],
};

export function can(session: Session | null, capability: string): boolean {
  if (!session) return false;
  const caps = CAPABILITIES[session.role] ?? [];
  if (caps.includes("*")) return true;
  const [domain] = capability.split(":");
  return caps.some((c) => c === capability || c === `${domain}:*`);
}

/**
 * Hard-gate a mutating route on a capability. Returns a Response-shaped
 * 403 envelope when denied; returns null when allowed. Pairs with
 * `withAuth` to form a two-step gate — withAuth proves "who", this
 * function proves "may". H2-10 / IK-017.
 *
 * Usage:
 *   return withAuth(async (session) => {
 *     const denial = assertCapability(session, "projects:write");
 *     if (denial) return denial;
 *     ...mutation...
 *   });
 */
export function assertCapability(session: Session, capability: string): Response | null {
  if (can(session, capability)) return null;
  return apiError("forbidden", `Role "${session.role}" lacks capability "${capability}"`);
}
