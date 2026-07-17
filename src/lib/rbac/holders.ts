/**
 * Who holds what — the console-side mirror of the capability resolution that
 * `getSession` performs per request (ADR-0015 / SCANNING_RBAC_BACKLOG P1.1c
 * and P2.4).
 *
 * `public.effective_capabilities()` deliberately answers only for the CALLER
 * (it reads auth.uid() internally — that is what makes SECURITY DEFINER safe
 * there), so an admin surface that wants "who in this org holds scan:asset"
 * cannot call it per member. This module recomputes the same union in TS from
 * the same rows the SQL reads:
 *
 *   role-derived  crew_members.crew_role_id → role_capability_grants
 *   individual    user_capability_grants, revoked_at NULL, window live at now
 *
 * layered onto the same static floor `can()` uses — by construction, not by
 * re-implementation: every capability question below is answered by calling
 * the real `can()` with a synthetic Session, so the matcher (`*`, `domain:*`)
 * and the persona-first floor lookup can never drift from what a live request
 * would decide. The one piece we mirror by hand is the grandfather blanket in
 * `auth.ts#resolveGrants` (legacy `check-in:write` ⇒ every `scan:*` while
 * `orgs.capability_grants_enforced` is false) — and the mirror is expressed
 * through the same `can()` floor check that resolveGrants performs.
 *
 * Pure on purpose: takes rows, returns answers. No Supabase client, so the
 * enforcement-flip preview can be unit-tested without a database.
 */

import { can, type Session } from "@/lib/auth";
import type { Persona, PlatformRole } from "@/lib/supabase/types";
import { GRANTABLE_CAPABILITIES, SCAN_CAPABILITIES, type GrantableCapability } from "./capabilities";

export type MemberInput = {
  userId: string;
  email: string;
  role: PlatformRole;
  /** memberships.persona — null falls back to the role, as getSession does. */
  persona: Persona | null;
};

export type RoleGrantInput = {
  crewRoleId: string;
  capability: string;
  shiftDerivable: boolean;
};

export type UserGrantInput = {
  userId: string;
  capability: string;
  validFrom: string | null;
  validUntil: string | null;
  revokedAt: string | null;
};

export type HoldersInput = {
  members: MemberInput[];
  /** userId → the crew_role_ids of that user's crew_members rows (usually one). */
  crewRoleIdsByUser: Map<string, string[]>;
  /** crew_role_id → display name, for attribution. */
  roleNameById: Map<string, string>;
  roleGrants: RoleGrantInput[];
  userGrants: UserGrantInput[];
  enforced: boolean;
  now: Date;
};

/** How a held capability is held — the attribution column of the view. */
export type HeldVia = "base" | "role" | "person" | "blanket";

export type Holding = {
  capability: GrantableCapability;
  held: boolean;
  via: HeldVia | null;
};

export type HolderRow = {
  userId: string;
  email: string;
  role: PlatformRole;
  persona: Persona;
  /** Names of the crew roles whose grants reached this person. */
  grantingRoles: string[];
  holdings: Holding[];
};

export type EnforcementDiffRow = {
  userId: string;
  email: string;
  role: PlatformRole;
  persona: Persona;
  /** Capabilities held under the CURRENT rule for `enforced`. */
  pre: GrantableCapability[];
  /** Capabilities held once grants are the source of truth. */
  post: GrantableCapability[];
  /** pre − post. Non-empty means the flip takes something away. */
  loses: GrantableCapability[];
};

/** Mirrors effective_capabilities' window predicate: server-now, half-open. */
export function isUserGrantLive(g: UserGrantInput, now: Date): boolean {
  if (g.revokedAt !== null) return false;
  if (g.validFrom !== null && Date.parse(g.validFrom) > now.getTime()) return false;
  if (g.validUntil !== null && Date.parse(g.validUntil) <= now.getTime()) return false;
  return true;
}

function syntheticSession(m: MemberInput, grants: string[]): Session {
  return {
    userId: m.userId,
    email: m.email,
    orgId: "org",
    orgSlug: "",
    role: m.role,
    isDeveloper: false,
    tier: "access",
    persona: m.persona ?? (m.role as Persona),
    grants,
  };
}

/**
 * Match `capability` against a raw grant list using the REAL matcher.
 *
 * `matchCapability` is private to auth.ts, so we borrow it through `can()`:
 * the `community` persona's floor is explicitly empty (`[]` in
 * CAPABILITIES_BY_PERSONA), which makes a community-persona session a clean
 * probe — `can()` can only answer true via the grants we hand it. If the
 * matcher's semantics ever change, this changes with it.
 */
function grantsMatch(grants: string[], capability: string): boolean {
  if (grants.length === 0) return false;
  return can(
    {
      userId: "probe",
      email: "",
      orgId: "org",
      orgSlug: "",
      role: "member",
      isDeveloper: false,
      tier: "access",
      persona: "community",
      grants,
    },
    capability,
  );
}

type ResolvedGrants = {
  /** All data-sourced grant strings, role + person, live only. */
  all: string[];
  fromRoles: string[];
  fromPerson: string[];
  grantingRoles: string[];
};

type ResolutionInput = Omit<HoldersInput, "enforced">;

function resolveDataGrants(m: MemberInput, input: ResolutionInput): ResolvedGrants {
  const crewRoleIds = input.crewRoleIdsByUser.get(m.userId) ?? [];
  const fromRoles: string[] = [];
  const grantingRoles = new Set<string>();
  for (const g of input.roleGrants) {
    if (crewRoleIds.includes(g.crewRoleId)) {
      fromRoles.push(g.capability);
      const name = input.roleNameById.get(g.crewRoleId);
      if (name) grantingRoles.add(name);
    }
  }
  const fromPerson = input.userGrants
    .filter((g) => g.userId === m.userId && isUserGrantLive(g, input.now))
    .map((g) => g.capability);
  return {
    all: [...new Set([...fromRoles, ...fromPerson])],
    fromRoles,
    fromPerson,
    grantingRoles: [...grantingRoles],
  };
}

/**
 * The grandfather blanket, exactly as `resolveGrants` synthesizes it: while
 * an org is NOT enforced, anyone whose static floor matches `check-in:write`
 * is treated as holding every scan capability.
 */
function holdsLegacyBlanket(m: MemberInput): boolean {
  return can(syntheticSession(m, []), "check-in:write");
}

function holdingsFor(m: MemberInput, input: ResolutionInput, enforced: boolean): Holding[] {
  const data = resolveDataGrants(m, input);
  const blanket = !enforced && holdsLegacyBlanket(m);
  const emptyFloor = syntheticSession(m, []);
  return GRANTABLE_CAPABILITIES.map((capability) => {
    const base = can(emptyFloor, capability);
    const viaRole = grantsMatch(data.fromRoles, capability);
    const viaPerson = grantsMatch(data.fromPerson, capability);
    const viaBlanket = blanket && (SCAN_CAPABILITIES as readonly string[]).includes(capability);
    const held = base || viaRole || viaPerson || viaBlanket;
    // Attribution priority: the floor beats a grant (an owner holds `*`
    // whatever the tables say), an explicit grant beats the blanket (it
    // survives the flip, so it is the truer answer).
    const via: HeldVia | null = !held
      ? null
      : base
        ? "base"
        : viaRole
          ? "role"
          : viaPerson
            ? "person"
            : "blanket";
    return { capability, held, via };
  });
}

/** The live "who holds what" view, under the org's CURRENT enforcement rule. */
export function computeHolders(input: HoldersInput): HolderRow[] {
  return input.members.map((m) => {
    const data = resolveDataGrants(m, input);
    return {
      userId: m.userId,
      email: m.email,
      role: m.role,
      persona: m.persona ?? (m.role as Persona),
      grantingRoles: data.grantingRoles,
      holdings: holdingsFor(m, input, input.enforced),
    };
  });
}

/**
 * The P2.4 preview: what does flipping `capability_grants_enforced` to TRUE
 * take away from whom? `pre` is resolved with the blanket, `post` without —
 * everything else (floor, role grants, person grants) is identical, so the
 * diff is exactly the blanket's reach minus what grants already cover.
 */
export function computeEnforcementDiff(input: Omit<HoldersInput, "enforced">): EnforcementDiffRow[] {
  return input.members.map((m) => {
    const pre = holdingsFor(m, input, false)
      .filter((h) => h.held)
      .map((h) => h.capability);
    const post = holdingsFor(m, input, true)
      .filter((h) => h.held)
      .map((h) => h.capability);
    return {
      userId: m.userId,
      email: m.email,
      role: m.role,
      persona: m.persona ?? (m.role as Persona),
      pre,
      post,
      loses: pre.filter((c) => !post.includes(c)),
    };
  });
}
