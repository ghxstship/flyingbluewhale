/**
 * Grantable capability catalog — the SSOT for add-on RBAC.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The static maps in `auth.ts` (`CAPABILITIES` by platform role,
 * `CAPABILITIES_BY_PERSONA`) are *code*: they answer "what does a manager get",
 * and they cannot answer "may Bob, who works logistics, scan assets tonight
 * because he's covering Dana's shift". Roles like "logistics" and "warehouse"
 * are org data, they differ per tenant, and they change without a deploy.
 *
 * So capabilities come from two places, unioned:
 *
 *   BASE   — static, in `auth.ts`. The floor. Owner/admin `*`, etc.
 *   GRANTS — data, in `role_capability_grants` + `user_capability_grants`.
 *            Additive on top of the floor.
 *
 * ADDITIVE ONLY — THERE ARE NO DENIES. A deny-list forces a precedence rule
 * ("does the individual deny beat the role grant?"), and every RBAC system that
 * grows one becomes unauditable. "Not every role should scan credentials" is
 * expressed by *not granting* `scan:credential`. If you ever think you need a
 * deny, you actually need a narrower base.
 *
 * WILDCARDS come free: `auth.ts#matchCapability` already matches `domain:*`, so
 * a `scan:*` grant covers every scan capability and owner/admin's `*` covers
 * everything, with no extra code.
 */

/**
 * The scan capabilities. These map 1:1 onto `ScanMode` (@/lib/scan/formats),
 * which is what makes enforcement a one-line lookup at the resolver: the mode
 * the surface is in IS the capability it needs.
 */
export const SCAN_CAPABILITIES = [
  "scan:credential", // gate / access control — the sensitive one
  "scan:asset", // gear, fleet, lots
  "scan:product", // retail / receiving / POS
  "scan:document", // reserved: document + envelope capture
] as const;

export type ScanCapability = (typeof SCAN_CAPABILITIES)[number];

/**
 * Asset custody — taking gear out and bringing it back.
 *
 * The base gate is manager+ ("Only manager+ can move assets"), which is the
 * rule the console has always enforced. Crew self-checkout is DECIDED
 * (2026-07-15) but deliberately *assignable* rather than global: one
 * customer's stagehands self-serve from a cage, another's want a storeman in
 * the loop, and both are right about their own site. That is precisely a
 * grant — by role, by person, or for a time window (the cover-shift case).
 *
 * NARROW ON PURPOSE. This grants check-out and check-in ONLY. Retire, write
 * off, and maintenance stay manager+ however this is assigned: taking a radio
 * off a shelf is custody; writing off a forklift is not. `transitionAssetState`
 * enforces that split — the grant is only consulted for the two custody moves.
 */
export const ASSET_CAPABILITIES = ["asset:custody"] as const;
export type AssetCapability = (typeof ASSET_CAPABILITIES)[number];

/**
 * Template management — curating the org's reusable template library
 * (/legend/hub/templates and each family's native surface).
 *
 * The base gate everywhere is the manager band. These grants let an org
 * delegate template curation without a role promotion — the "brand/ops
 * coordinator maintains the library" case. Two capabilities on purpose:
 * `templates:write` shapes content (create/edit/configure/archive);
 * `templates:publish` flips what every project inherits (publish/unpublish),
 * which some orgs will want held tighter than editing.
 */
export const TEMPLATE_CAPABILITIES = ["templates:write", "templates:publish"] as const;
export type TemplateCapability = (typeof TEMPLATE_CAPABILITIES)[number];

/** Every capability that may be granted as an add-on. */
export const GRANTABLE_CAPABILITIES = [
  ...SCAN_CAPABILITIES,
  ...ASSET_CAPABILITIES,
  ...TEMPLATE_CAPABILITIES,
] as const;
export type GrantableCapability = (typeof GRANTABLE_CAPABILITIES)[number];

const GRANTABLE = new Set<string>(GRANTABLE_CAPABILITIES);

/**
 * True when `capability` is one the grant layer recognises.
 *
 * Guards the write path: an unknown capability string in a grant row is a typo
 * that silently grants nothing, which is the worst failure mode for a
 * permission system — it looks configured and isn't.
 */
export function isGrantableCapability(capability: string): capability is GrantableCapability {
  return GRANTABLE.has(capability);
}

/** Operator-facing labels for the grant admin surfaces. */
export const CAPABILITY_LABEL: Record<GrantableCapability, string> = {
  "scan:credential": "Scan credentials",
  "scan:asset": "Scan assets",
  "scan:product": "Scan products",
  "scan:document": "Scan documents",
  "asset:custody": "Take gear out and bring it back",
  "templates:write": "Edit the template library",
  "templates:publish": "Publish org templates",
};

export const CAPABILITY_DESCRIPTION: Record<GrantableCapability, string> = {
  "scan:credential": "Verify passes and wristbands at a gate. Grant deliberately.",
  "scan:asset": "Check gear, vehicles and lots in and out.",
  "scan:product": "Look up retail barcodes when receiving or counting stock.",
  "scan:document": "Capture documents and envelopes.",
  "asset:custody":
    "Check gear out and back in without a manager. Retiring or writing off an asset always stays manager-only.",
  "templates:write":
    "Create, edit, configure and archive the org's reusable templates without a manager role.",
  "templates:publish":
    "Publish or unpublish org templates — what every project inherits. Grant deliberately.",
};

/**
 * Capabilities a shift may confer automatically when someone works a role they
 * don't normally hold (see `role_capability_grants.shift_derivable`).
 *
 * `scan:credential` is deliberately absent. Shift-derived grants make the
 * SCHEDULER an authorization surface — whoever can roster Bob onto a warehouse
 * shift can hand him that role's capabilities. That is the intended ergonomics
 * for gear and stock, and exactly what you do NOT want for gate access, which
 * should require a deliberate, attributable grant.
 */
export const SHIFT_DERIVABLE_BY_DEFAULT: readonly GrantableCapability[] = [
  "scan:asset",
  "scan:product",
  "scan:document",
];

/**
 * Capabilities that may NEVER be shift-derived, whatever the
 * `shift_derivable` flag on the grant row says.
 *
 * This is stronger than being absent from `SHIFT_DERIVABLE_BY_DEFAULT` (a UI
 * default an admin can override per row — `asset:custody` is exactly that
 * case). `scan:credential` is derivation-EXCLUDED: gate access must come from
 * a deliberate, attributable grant, never as a side effect of rostering. The
 * SQL resolver (`effective_capabilities`, migration
 * `20260717130531_shift_derived_grants.sql`) hard-codes the same exclusion in
 * its shift-derived branch; this constant is the TS mirror, and the grant
 * admin action refuses to set `shift_derivable` on an excluded capability so
 * the flag can't be configured into a no-op.
 */
export const SHIFT_DERIVATION_EXCLUDED: readonly GrantableCapability[] = [
  "scan:credential",
  // Template curation is org configuration, not shift work — rostering someone
  // onto a shift must never let them reshape what every project inherits.
  "templates:write",
  "templates:publish",
];

/**
 * May a role grant for `capability` confer that capability via a shift?
 * True only for real grantable capabilities outside the exclusion list —
 * the row's `shift_derivable` flag is then the org's per-(role, capability)
 * decision; this predicate is the ceiling it operates under.
 */
export function isShiftDerivable(capability: string): boolean {
  return (
    isGrantableCapability(capability) &&
    !(SHIFT_DERIVATION_EXCLUDED as readonly string[]).includes(capability)
  );
}

/** The `ScanMode` → capability map. `any` is not a capability; see resolveScan. */
export const SCAN_MODE_CAPABILITY = {
  access: "scan:credential",
  asset: "scan:asset",
  pos: "scan:product",
} as const satisfies Record<"access" | "asset" | "pos", ScanCapability>;
