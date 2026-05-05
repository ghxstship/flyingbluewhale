import "server-only";
import { redirect } from "next/navigation";
import { apiError } from "./api";
import { createClient } from "./supabase/server";
import { hasSupabase } from "./env";
import type { Persona, PlatformRole, ProjectRole, Tier } from "./supabase/types";

const DEMO_ORG_SLUG = "demo";

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
  orgSlug: string;
  role: PlatformRole;
  isDeveloper: boolean;
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

  // Prefer a real-org membership. The demo-org membership is the fallback
  // every signed-up user has via the auto-add trigger; we only surface it
  // when there's nothing else. Among real orgs, prefer the user's
  // `last_org_id` preference (set by /api/v1/me/workspaces PATCH) so the
  // workspace switcher actually sticks across requests.
  const { data: memberships } = await supabase
    .from("memberships")
    .select("org_id, role, is_developer, orgs(slug, tier)")
    .eq("user_id", user.id);

  type Row = {
    org_id: string;
    role: PlatformRole;
    is_developer: boolean;
    orgs: { slug: string; tier: Tier } | null;
  };
  const rows = (memberships ?? []) as unknown as Row[];

  if (rows.length === 0) {
    // No membership at all — should not happen post-trigger, but treat as a
    // bare guest session pointing at /me.
    return guestSession(user.id, user.email ?? "");
  }

  let lastOrgId: string | null = null;
  try {
    const { data: pref } = await (
      supabase.from("user_preferences") as unknown as {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => { maybeSingle: () => Promise<{ data: { last_org_id: string | null } | null }> };
        };
      }
    )
      .select("last_org_id")
      .eq("user_id", user.id)
      .maybeSingle();
    lastOrgId = pref?.last_org_id ?? null;
  } catch {
    // user_preferences may be missing in legacy environments — fall through.
  }

  const realRows = rows.filter((r) => r.orgs?.slug !== DEMO_ORG_SLUG);
  const preferred = lastOrgId ? realRows.find((r) => r.org_id === lastOrgId) : null;
  const real = preferred ?? realRows[0] ?? null;
  const chosen = real ?? rows[0];
  const isGuest = chosen.orgs?.slug === DEMO_ORG_SLUG && !real;

  return {
    userId: user.id,
    email: user.email ?? "",
    orgId: chosen.org_id,
    orgSlug: chosen.orgs?.slug ?? "",
    role: chosen.role,
    isDeveloper: chosen.is_developer,
    tier: chosen.orgs?.tier ?? "access",
    persona: isGuest ? "guest" : personaForRole(chosen.role),
  };
}

function guestSession(userId: string, email: string): Session {
  return {
    userId,
    email,
    orgId: "",
    orgSlug: "",
    role: "member",
    isDeveloper: false,
    tier: "access",
    persona: "guest",
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
  return role;
}

export function resolveShell(persona: Persona): "/console" | "/p" | "/m" | "/me" {
  // Guests + member-only personas land at /me — they're applicants /
  // contributors (talent, crew, vendor candidates), not operators. Manager+
  // (owner, admin, manager) personas land in the console where org-running
  // surfaces live. Portal/mobile shells are entered explicitly via
  // /p/<slug> or /m, not auto-routed.
  if (persona === "guest" || persona === "visitor" || persona === "member") return "/me";
  return "/console";
}

// Platform-role band checks — the canonical helpers callers should use
// instead of inlining `["owner","admin",...].includes(...)`.
export function isOwner(session: Session | null): boolean {
  return session?.role === "owner";
}

export function isAdmin(session: Session | null): boolean {
  return session?.role === "owner" || session?.role === "admin";
}

export function isManagerPlus(session: Session | null): boolean {
  if (!session) return false;
  return session.role === "owner" || session.role === "admin" || session.role === "manager";
}

export function isDeveloper(session: Session | null): boolean {
  return !!session?.isDeveloper;
}

// Project-role check — caller has one of `roles` on `projectId`, OR is
// platform manager+ in the project's org (auto-bypass mirrors the SQL helper).
// Intentionally async: we read project_members live so role grants take
// effect without requiring a session refresh.
export async function hasProjectRole(
  session: Session | null,
  projectId: string,
  roles: readonly ProjectRole[],
): Promise<boolean> {
  if (!session) return false;
  if (isManagerPlus(session)) return true;
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!data) return false;
  return (roles as readonly string[]).includes((data as { role: ProjectRole }).role);
}

// Capability matrix — keep narrow. Most authorization should be RLS at the
// data layer; this is for UI gating + 403 responses on mutating routes.
const CAPABILITIES: Record<PlatformRole, readonly string[]> = {
  owner: ["*"],
  admin: ["*"],
  manager: [
    "projects:*",
    "tasks:*",
    "schedule:*",
    "crew:*",
    "proposals:*",
    "clients:*",
    "invoices:read",
    "invoices:write",
    "expenses:*",
    "budgets:read",
    "time:*",
    "mileage:*",
    "procurement:*",
  ],
  member: ["projects:read", "tasks:read", "tasks:write", "time:write", "check-in:*"],
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
