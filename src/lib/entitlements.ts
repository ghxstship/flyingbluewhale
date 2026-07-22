/**
 * Ecosystem entitlements — SSOT for the global App Rail.
 *
 * The vendored `entitlements.json` is the design contract (apps, the
 * persona→app reach matrix, and the rail rules), handed off from the ATLVS
 * Ecosystem kit. This module types it, and layers the REPO's addressing on
 * top: products navigate through `urlFor(shell, path)` (the canonical
 * subdomain/path-prefix switch) rather than the contract's design-time hosts,
 * and the seven extensions are flagged **coming soon** until their surfaces
 * are built (then flip `available`).
 *
 * The runtime entitled-app list is API-fed (`GET /v1/me/entitlements`,
 * `src/app/api/v1/me/entitlements/route.ts`); this file is the shape + the
 * design-time fallback + the resolver that maps a session to reachable apps.
 *
 * Guard: `src/lib/entitlements.test.ts` keeps the typed catalog in lockstep
 * with the JSON contract.
 */
import raw from "./entitlements.json";
import { urlFor, type Shell } from "./urls";

export type AppId =
  | "atlvs"
  | "compvss"
  | "gvteway"
  | "legend"
  | "opvs"
  | "cvrgo"
  | "vault"
  | "mvnifest"
  | "gvlley"
  | "social"
  | "email";

export type AppTier = "product" | "extension";
/** `full` = read+write · `ro` = read-only (rail opens, edits suppressed, banner). */
export type Access = "full" | "ro";

type RawApp = {
  id: string;
  name: string;
  tier: string;
  accentOwner: string;
  host: string;
  routeGroup: string;
  icon: string;
  addressing: string;
  parent?: string;
  pwa?: boolean;
  note?: string;
};

export type EcosystemApp = {
  id: AppId;
  name: string;
  tier: AppTier;
  /** The product whose accent this surface paints with (`data-product`). */
  accentOwner: string;
  /** Lucide icon name (kebab-case) — resolved to a component in the rail. */
  icon: string;
  /** The internal route group (e.g. `/studio`, `/m`, `/console/opvs`). */
  routeGroup: string;
  addressing: "subdomain" | "path";
  parent?: AppId;
};

const RAW_APPS = (raw.apps as RawApp[]).map(
  (a): EcosystemApp => ({
    id: a.id as AppId,
    name: a.name,
    tier: a.tier as AppTier,
    accentOwner: a.accentOwner,
    icon: a.icon,
    routeGroup: a.routeGroup,
    addressing: a.addressing as "subdomain" | "path",
    parent: a.parent as AppId | undefined,
  }),
);

/** App catalog keyed by id, in canonical rail order. */
export const ECOSYSTEM_APPS: EcosystemApp[] = RAW_APPS;
export const APP_BY_ID: Record<AppId, EcosystemApp> = Object.fromEntries(
  RAW_APPS.map((a) => [a.id, a]),
) as Record<AppId, EcosystemApp>;

/** Canonical top-to-bottom rail order. */
export const RAIL_ORDER = raw.rules.railOrder as AppId[];
/** Visual groups in the rail (Products / Extensions). */
export const RAIL_GROUPS = raw.rules.groups as { label: string; apps: AppId[] }[];
/** Render the rail only when the user can reach at least this many apps. */
export const SHOW_RAIL_WHEN_GTE = raw.rules.showRailWhenEntitledAppsGTE as number;

/** Per-persona reach matrix from the contract (design fallback / reference). */
export const PERSONA_REACH = raw.personas as {
  id: string;
  name: string;
  landing: AppId;
  reach: "all" | Partial<Record<AppId, Access>>;
}[];

// ── Repo addressing ─────────────────────────────────────────────────────────
// Products map to a Next shell so `urlFor` builds the canonical cross-host URL
// (honouring subdomain vs path-prefix mode). Extensions live as paths under the
// platform host but are COMING SOON — no href until their surfaces ship.
const PRODUCT_SHELL: Partial<Record<AppId, Shell>> = {
  atlvs: "platform",
  compvss: "mobile",
  gvteway: "portal",
  legend: "legend",
};

/** Which surfaces are live. Products are built; extensions ship later. */
export const AVAILABLE: Record<AppId, boolean> = {
  atlvs: true,
  compvss: true,
  gvteway: true,
  legend: true,
  opvs: false,
  cvrgo: false,
  vault: false,
  mvnifest: false,
  gvlley: false,
  social: false,
  email: false,
};

/** The active product for a given Next shell (drives the rail highlight). */
export function activeAppForShell(shell: Shell): AppId | null {
  const hit = Object.entries(PRODUCT_SHELL).find(([, s]) => s === shell);
  return (hit?.[0] as AppId | undefined) ?? null;
}

/**
 * Navigable URL for an app, or `null` when there's nowhere to go yet
 * (coming-soon extensions). Products resolve through `urlFor`; the portal
 * lands on the caller's current slug when known.
 */
export function hrefForApp(id: AppId, opts?: { portalSlug?: string | null }): string | null {
  if (!AVAILABLE[id]) return null;
  const shell = PRODUCT_SHELL[id];
  if (!shell) return null;
  if (id === "gvteway") {
    return urlFor("portal", opts?.portalSlug ? `/p/${opts.portalSlug}` : "/p");
  }
  return urlFor(shell, APP_BY_ID[id].routeGroup);
}

// ── Session → reachable apps ────────────────────────────────────────────────
export type ResolvedApp = {
  id: AppId;
  name: string;
  tier: AppTier;
  icon: string;
  accentOwner: string;
  /** `full` / `ro` when reachable, `null` when locked/hidden. */
  access: Access | null;
  /** Surface not built yet — render disabled with a "Soon" affordance. */
  comingSoon: boolean;
  href: string | null;
};

type ResolveOpts = {
  role: string | null;
  persona: string | null;
  isDeveloper: boolean;
  /** User has a portal footing (project_members / account-manager row). */
  hasPortal: boolean;
  portalSlug?: string | null;
};

const INTERNAL_ROLES = new Set(["owner", "admin", "manager", "member", "collaborator", "contractor", "crew"]);

/**
 * Product reach for a session. This is the design-time fallback RBAC (the
 * production source is the API). Internal staff operate ATLVS + COMPVSS; a
 * portal footing unlocks GVTEWAY; LEG3ND knowledge is broadly readable;
 * developers reach everything.
 */
function productAccess(id: AppId, o: ResolveOpts): Access | null {
  if (o.isDeveloper) return "full";
  const internal = !!o.role && INTERNAL_ROLES.has(o.role);
  const isViewer = o.role === "viewer" || o.persona === "viewer";
  switch (id) {
    case "atlvs":
      return internal ? (isViewer ? "ro" : "full") : null;
    case "compvss":
      // Field ops — internal staff only (clients/partners don't see it).
      return internal ? "full" : null;
    case "gvteway":
      return o.hasPortal ? "full" : internal && !isViewer ? "full" : null;
    case "legend":
      // Knowledge base — readable by any authenticated user.
      return "ro";
    default:
      return null; // extensions handled separately
  }
}

/**
 * Resolve the full rail for a session: every app in rail order with its
 * access (or coming-soon flag). The rail component decides what to show; the
 * gate (`shouldShowRail`) keys off the reachable-product count.
 */
/**
 * Extensions toggle (owner directive 2026-07-22): the seven extension apps
 * (OPVS, CVRGO, Vault, MVNIFEST, GVLLEY, Social, Email) are hidden from every
 * surface until their own marketing/product pass, much later. Flip to true to
 * bring the coming-soon rail entries back; the registry entries, accents and
 * theme tokens stay (they are infrastructure, not copy).
 */
export const EXTENSIONS_VISIBLE = false;

export function resolveEntitledApps(o: ResolveOpts): ResolvedApp[] {
  const order = EXTENSIONS_VISIBLE
    ? RAIL_ORDER
    : RAIL_ORDER.filter((id) => APP_BY_ID[id].tier !== "extension");
  return order.map((id) => {
    const app = APP_BY_ID[id];
    const comingSoon = !AVAILABLE[id];
    const access = comingSoon ? null : productAccess(id, o);
    return {
      id,
      name: app.name,
      tier: app.tier,
      icon: app.icon,
      accentOwner: app.accentOwner,
      access,
      comingSoon,
      href: access ? hrefForApp(id, { portalSlug: o.portalSlug }) : null,
    };
  });
}

/** Apps the user can actually open right now (live + reachable). */
export function reachableApps(apps: ResolvedApp[]): ResolvedApp[] {
  return apps.filter((a) => a.access !== null && !a.comingSoon);
}

/** Rail-render gate: ≥ N reachable apps, never on public/logged-out surfaces. */
export function shouldShowRail(apps: ResolvedApp[]): boolean {
  return reachableApps(apps).length >= SHOW_RAIL_WHEN_GTE;
}
