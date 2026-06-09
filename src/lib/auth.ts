import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiError } from "./api";
import { createClient } from "./supabase/server";
import { hasSupabase } from "./env";
import { urlFor } from "./urls";
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
  /**
   * Programmatic API key scopes, when the session is sourced from a PAT.
   * Undefined for cookie sessions (full user capabilities). Empty array,
   * undefined, or `["*"]` are all interpreted as wildcard — any scope is
   * allowed. Use `assertScope(session, "foo:write")` at API boundaries
   * that want to gate beyond persona/role.
   */
  scopes?: string[];
};

export async function getSession(): Promise<Session | null> {
  if (!hasSupabase) return null;

  // Bearer-token auth (personal access tokens) takes priority over the
  // session cookie when both are present. This mirrors Stripe / GitHub:
  // a token explicitly attached by the caller is the strongest signal of
  // intent, and it lets a developer test a token from a logged-in browser
  // without first signing out.
  //
  // Token prefix is `sk_` (see mintToken in src/lib/api-keys.ts). The
  // earlier `pat_` prefix matcher was a leftover from a planned rename
  // that never landed — it made the entire PAT auth path dead code, so
  // every documented API call with `Authorization: Bearer sk_…` silently
  // fell through to cookie-only auth. Aligning the regex restores PAT
  // auth as documented in `/api/v1/openapi.json`.
  const authHeader = await readAuthorizationHeader();
  if (authHeader && /^Bearer\s+sk_/i.test(authHeader)) {
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
    // Persona column added in migration `memberships_persona_column`.
    // Cast through unknown until gen:types refreshes; the value is one of
    // the PERSONAS literals enforced by the SQL CHECK constraint.
    .select("org_id, role, persona, is_developer, orgs(slug, tier)")
    .eq("user_id", user.id)
    // Soft-deleted memberships (set by /api/v1/me/delete or admin removal)
    // must not resolve to an active session — otherwise an offboarded
    // user who signs back in within the 30-day grace window is silently
    // re-granted org access. RLS on dependent tables would still gate,
    // but session.orgId here is what every action uses for org-scoping.
    .is("deleted_at", null);

  type Row = {
    org_id: string;
    role: PlatformRole;
    persona: Persona | null;
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
    // Persona-first: prefer the per-membership persona (granular: crew /
    // client / contractor / etc.) and fall back to role-based mapping for
    // pre-migration rows or memberships that opted not to set it. The
    // demo-only fallback to "guest" only fires when persona is *unset* —
    // an explicit persona on a seeded demo-org membership is honored so
    // dev/test workflows can land in /console, /p, or /m as configured.
    persona: chosen.persona ?? (isGuest ? "guest" : personaForRole(chosen.role)),
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

export async function requireSession(redirectTo?: string): Promise<Session> {
  const s = await getSession();
  // Default redirect goes through urlFor("auth", "/login") so subdomain shells
  // (app.atlvs.pro, gvteway.atlvs.pro, compvss.atlvs.pro) bounce to the apex
  // where the auth shell actually lives. A bare "/login" here 404s on every
  // subdomain — that's the bug this default exists to prevent. Callers passing
  // a relative path get the same treatment.
  //
  // The proxy injects x-pathname (the internal route path) so an expired
  // session returns to where it was after re-auth instead of the shell root.
  if (!s) {
    let target = redirectTo;
    if (!target) {
      const h = await headers();
      const path = h.get("x-pathname");
      const next =
        path && path.startsWith("/") && !path.startsWith("//") && path !== "/login" && path.length <= 512
          ? `?next=${encodeURIComponent(path)}`
          : "";
      target = urlFor("auth", `/login${next}`);
    }
    redirect(target);
  }
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
  // Persona → shell mapping. Drives /auth/resolve auto-routing on login.
  //
  //   /console — operator personas (owner/admin/manager + collaborator,
  //              the co-producer with project-write authority).
  //   /p       — portal personas (client receives proposals; contractor
  //              vendor-side workflows).
  //   /m       — field persona (crew runs gates, scans, shifts).
  //   /me      — every other persona: pure consumers (viewer, community)
  //              and pre-org accounts (guest, visitor, generic member).
  //
  // Contract enforced by e2e/handoff-shells.spec.ts § handoff/auth-resolve.
  switch (persona) {
    case "owner":
    case "admin":
    case "manager":
    case "collaborator":
      return "/console";
    case "client":
    case "contractor":
      return "/p";
    case "crew":
      return "/m";
    case "viewer":
    case "community":
    case "member":
    case "guest":
    case "visitor":
    default:
      return "/me";
  }
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
//
// Manager+ auto-bypass MUST verify the project belongs to the session's
// org first — otherwise an org-A admin would be granted authority on
// org-B projects whenever this helper is hit with a foreign projectId.
export async function hasProjectRole(
  session: Session | null,
  projectId: string,
  roles: readonly ProjectRole[],
): Promise<boolean> {
  if (!session) return false;
  const supabase = await createClient();
  if (isManagerPlus(session)) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    return !!project;
  }
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
//
// PlatformRole map (coarse). Used as a fallback when the more granular
// per-persona map below has no entry for the caller's persona.
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

// Per-persona overlay (granular). Bug #13 / Workstream A1 — the 4-value
// PlatformRole couldn't distinguish crew (gate scanner) from client
// (read-only stakeholder) from collaborator (co-producer with project
// write authority). All three previously collapsed to PlatformRole=member
// and inherited member capabilities, which let clients scan tickets and
// hid project-write from collaborators.
//
// When a persona has an entry here it is the source of truth — even an
// EMPTY array means "this persona has no capabilities" (intentional
// for `community`, the public-marketplace browser). Personas without an
// entry fall through to the platform-role map.
const CAPABILITIES_BY_PERSONA: Partial<Record<Persona, readonly string[]>> = {
  // Co-producer. Project + scheduling + crew authority but no finance /
  // procurement (those stay manager+).
  collaborator: [
    "projects:*",
    "tasks:*",
    "schedule:*",
    "crew:*",
    "proposals:read",
    "clients:read",
    "time:*",
    "mileage:*",
  ],
  // Outside contributor with task-write but no project-write.
  contractor: ["projects:read", "tasks:read", "tasks:write", "time:write"],
  // Field operator. Scanning is the defining capability.
  crew: ["check-in:*", "tasks:read", "tasks:write", "time:write"],
  // Proposal recipient / portal viewer. Read-only.
  client: ["proposals:read", "deliverables:read", "tasks:read"],
  // Generic read-only stakeholder. Same read scope as `client` so a
  // GVTEWAY stakeholder-viewer can browse proposals + deliverables on
  // a project they've been added to. Without proposals:read /
  // deliverables:read here, a stakeholder-viewer who follows a portal
  // link sees a 403 on the only screens they care about.
  viewer: ["projects:read", "tasks:read", "proposals:read", "deliverables:read"],
  // Public marketplace browser; no organizational capabilities at all.
  community: [],
  // `guest` (pre-real-org member) and `visitor` (anon) intentionally
  // omitted — they fall through to role-based and get nothing because
  // role is "member" with no auth context.
};

function matchCapability(caps: readonly string[], capability: string): boolean {
  if (caps.includes("*")) return true;
  const [domain] = capability.split(":");
  return caps.some((c) => c === capability || c === `${domain}:*`);
}

export function can(session: Session | null, capability: string): boolean {
  if (!session) return false;
  // Persona-first lookup. Empty array is meaningful — "explicitly nothing".
  const personaCaps = CAPABILITIES_BY_PERSONA[session.persona];
  if (personaCaps !== undefined) return matchCapability(personaCaps, capability);
  // Persona has no per-persona overlay — fall back to platform role.
  const roleCaps = CAPABILITIES[session.role] ?? [];
  return matchCapability(roleCaps, capability);
}

/**
 * Hard-gate a mutating route on a capability. Returns a Response-shaped
 * 403 envelope when denied; returns null when allowed. Pairs with
 * `withAuth` to form a two-step gate — withAuth proves "who", this
 * function proves "may". H2-10 / IK-017.
 *
 * Implicitly enforces PAT scopes: if the session is sourced from an API key
 * with explicit `scopes`, the capability must be in the scope list. Cookie
 * sessions (no scopes) and wildcard-scoped tokens (`[]` or `["*"]`) skip
 * the scope check. This gives every existing `assertCapability` call site
 * automatic scope enforcement without per-route edits — the convention is
 * that `capability` and `scope` use the same `domain:action` strings.
 *
 * Usage:
 *   return withAuth(async (session) => {
 *     const denial = assertCapability(session, "projects:write");
 *     if (denial) return denial;
 *     ...mutation...
 *   });
 */
export function assertCapability(session: Session, capability: string): Response | null {
  // PAT scope check first — surfaces a clearer error message that names
  // the scope rather than the persona/role. If a token-restricted call
  // passes the scope gate, fall through to the persona/role check.
  const scopeDenial = assertScope(session, capability);
  if (scopeDenial) return scopeDenial;
  if (can(session, capability)) return null;
  // Surface persona (granular) in the error so operators auditing 403s see
  // which marketplace persona was rejected — not just the coarse role.
  return apiError(
    "forbidden",
    `Persona "${session.persona}" (role "${session.role}") lacks capability "${capability}"`,
  );
}

/**
 * PAT-scope gate. Returns a 403 envelope when the session is sourced from
 * an API key whose `scopes` array doesn't include the required scope; null
 * when the session is a cookie (no scopes) or the scope is permitted.
 *
 * Convention: `undefined`, `[]`, and `["*"]` are all wildcards. This is
 * Stripe / GitHub-style: a token minted without explicit scopes is treated
 * as the full capability set of its issuer. Use alongside `assertCapability`
 * for routes that want EITHER role-based OR scope-based gating.
 *
 *   return withAuth(async (session) => {
 *     const scopeDenial = assertScope(session, "projects:write");
 *     if (scopeDenial) return scopeDenial;
 *     const capDenial = assertCapability(session, "projects:write");
 *     if (capDenial) return capDenial;
 *     ...mutation...
 *   });
 *
 * Routes that are intentionally cookie-only (e.g. PAT-blocked endpoints)
 * should check `session.scopes !== undefined` and refuse.
 */
export function assertScope(session: Session, scope: string): Response | null {
  // Cookie session — no scope restriction.
  if (session.scopes === undefined) return null;
  // Wildcard.
  if (session.scopes.length === 0 || session.scopes.includes("*")) return null;
  // Match exact OR domain wildcard (`projects:*` permits `projects:write`).
  const [domain] = scope.split(":");
  if (session.scopes.includes(scope) || session.scopes.includes(`${domain}:*`)) return null;
  return apiError("forbidden", `API key lacks scope "${scope}"`);
}
