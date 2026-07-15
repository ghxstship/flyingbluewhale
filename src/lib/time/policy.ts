import { resolveZoneForPunch, type PunchGeofenceState, type ZoneCandidate } from "@/lib/workforce";

/**
 * Geofence enforcement policy — the decision layer over
 * `resolveZoneForPunch`.
 *
 * Pure and dependency-free on purpose. The server is authoritative, but the
 * mobile client has to run the SAME decision offline against a cached
 * policy so a worker gets the block prompt at the moment they punch rather
 * than a silent drop on replay hours later. One function, two callers, no
 * chance of the two drifting into different verdicts.
 *
 * THE RULE THAT SHAPES ALL OF THIS: a geofence block must never destroy a
 * record of worked time. Under FLSA an employer owes wages for hours
 * actually worked; a geofence is an employer convenience, not a
 * wage-eligibility test. So `block` refuses the FRICTIONLESS punch and
 * offers an override — it never refuses the worker a way to record time.
 * Every path below either accepts, or blocks with `overrideAvailable`.
 */

export const GEOFENCE_POLICIES = ["block", "warn", "record_only"] as const;
export type GeofencePolicy = (typeof GEOFENCE_POLICIES)[number];

export const ENFORCEMENT_STATES = ["clean", "warned", "quarantined", "overridden"] as const;
export type EnforcementState = (typeof ENFORCEMENT_STATES)[number];

export const PUNCH_SOURCE_CHANNELS = ["app", "offline_replay", "manager_entry", "correction", "import"] as const;
export type PunchSourceChannel = (typeof PUNCH_SOURCE_CHANNELS)[number];

/** Org-level defaults. Mirrors `public.org_time_settings`. */
export type OrgTimeSettings = {
  geofence_policy: GeofencePolicy;
  accuracy_threshold_m: number;
  grace_radius_m: number;
  allow_offline_punch_when_blocking: boolean;
};

/**
 * The defaults an org gets with no `org_time_settings` row. These
 * reproduce pre-Phase-1 behaviour exactly: classify, record, never block.
 * Keep in lockstep with the column defaults in
 * 20260715150100_geofence_policy.sql.
 */
export const DEFAULT_ORG_TIME_SETTINGS: OrgTimeSettings = {
  geofence_policy: "record_only",
  accuracy_threshold_m: 100,
  grace_radius_m: 50,
  allow_offline_punch_when_blocking: true,
};

/** A zone plus its optional per-zone policy overrides. */
export type PolicyZone = ZoneCandidate & {
  geofence_policy?: GeofencePolicy | null;
  accuracy_threshold_m?: number | null;
  grace_radius_m?: number | null;
};

export type EffectivePolicy = {
  policy: GeofencePolicy;
  accuracyThresholdM: number;
  graceRadiusM: number;
};

/**
 * Resolve zone -> org -> hardcoded default. A null zone column means
 * "inherit", which is why those columns are nullable rather than defaulted.
 */
export function resolveEffectivePolicy(
  zone: PolicyZone | null,
  settings: OrgTimeSettings = DEFAULT_ORG_TIME_SETTINGS,
): EffectivePolicy {
  return {
    policy: zone?.geofence_policy ?? settings.geofence_policy,
    accuracyThresholdM: zone?.accuracy_threshold_m ?? settings.accuracy_threshold_m,
    graceRadiusM: zone?.grace_radius_m ?? settings.grace_radius_m,
  };
}

export type PunchFix = {
  lat: number;
  lng: number;
  /** Metres of uncertainty. Null/undefined = the device didn't say, which
   *  is treated as unverified confidence, never as precise. */
  accuracyM?: number | null;
} | null;

export type PunchEvaluationInput = {
  fix: PunchFix;
  zones: readonly PolicyZone[];
  settings?: OrgTimeSettings;
  /** A worker-supplied justification for punching anyway. Its presence is
   *  what converts a block into an accepted-but-quarantined punch. */
  overrideReason?: string | null;
  /** True when the server could not evaluate the fix as authoritative —
   *  currently an offline replay. Such a punch is quarantined rather than
   *  refused, so the queue can never silently lose worked time. */
  isReplay?: boolean;
};

export type PunchEvaluation = {
  outcome: "accept" | "block";
  geofenceState: PunchGeofenceState;
  enforcementState: EnforcementState;
  zoneId: string | null;
  zoneName: string | null;
  nearestZoneId: string | null;
  nearestZoneName: string | null;
  distanceM: number | null;
  policy: GeofencePolicy;
  /** Only meaningful when `outcome === "block"`. Always true today: there
   *  is no configuration in which a worker is left with no way to record
   *  time. Modelled explicitly so the contract is visible at the call
   *  site rather than implied. */
  overrideAvailable: boolean;
  /** Machine-readable cause, for the API envelope and the audit row. */
  reason: PunchReason;
};

export type PunchReason =
  | "inside_zone"
  | "inside_grace"
  | "no_zones_configured"
  | "no_fix"
  | "low_accuracy"
  | "outside_zone"
  | "worker_override"
  | "offline_replay_unverified";

const MIN_OVERRIDE_REASON = 10;

/** A worker's override needs to say something, not just be non-empty. */
export function isUsableOverrideReason(reason: string | null | undefined): boolean {
  return typeof reason === "string" && reason.trim().length >= MIN_OVERRIDE_REASON;
}

/**
 * Decide what happens to a punch. The single source of truth for geofence
 * enforcement, shared by the server routes and the offline client.
 *
 * Order matters:
 *  1. Resolve the zone (with grace), so policy can be read off the zone
 *     the worker is actually at.
 *  2. Apply the accuracy gate BEFORE acting on 'outside'. A 500 m-accurate
 *     fix that lands outside a 100 m zone proves nothing; blocking on it
 *     punishes bad signal rather than absence.
 *  3. Only then enforce.
 */
export function evaluatePunch(input: PunchEvaluationInput): PunchEvaluation {
  const settings = input.settings ?? DEFAULT_ORG_TIME_SETTINGS;

  // Policy is read off the zone the worker resolved to. Grace needs a
  // policy and policy needs a zone, so resolve once with the org grace to
  // find the zone, then re-resolve if that zone overrides grace.
  const first = resolveZoneForPunch(input.fix, input.zones, { graceM: settings.grace_radius_m });
  const anchorZone = (first.zone ?? first.nearestZone) as PolicyZone | null;
  const effective = resolveEffectivePolicy(anchorZone, settings);
  const resolution =
    effective.graceRadiusM === settings.grace_radius_m
      ? first
      : resolveZoneForPunch(input.fix, input.zones, { graceM: effective.graceRadiusM });

  const base = {
    zoneId: resolution.zone?.id ?? null,
    zoneName: resolution.zone?.name ?? null,
    nearestZoneId: resolution.nearestZone?.id ?? null,
    nearestZoneName: resolution.nearestZone?.name ?? null,
    distanceM: resolution.distanceM,
    policy: effective.policy,
    overrideAvailable: false,
  };

  const accept = (
    geofenceState: PunchGeofenceState,
    enforcementState: EnforcementState,
    reason: PunchReason,
  ): PunchEvaluation => ({ ...base, outcome: "accept", geofenceState, enforcementState, reason });

  // --- Inside ------------------------------------------------------------
  if (resolution.state === "inside") {
    return resolution.viaGrace
      ? accept("inside", "warned", "inside_grace")
      : accept("inside", "clean", "inside_zone");
  }

  // --- Unknown: no fix, or no zones to compare against --------------------
  // Never blocked. A worker whose GPS was denied, whose phone is in a
  // steel-frame loading dock, or whose org never configured zones still
  // clocks in. Under a block policy the punch is flagged for review; under
  // anything else it is simply unclassified, as it is today.
  if (resolution.state === "unknown") {
    const reason: PunchReason = input.fix ? "no_zones_configured" : "no_fix";
    return effective.policy === "block"
      ? accept("unknown", "quarantined", reason)
      : accept("unknown", "clean", reason);
  }

  // --- Outside, but the fix is too vague to trust -------------------------
  const accuracyM = input.fix?.accuracyM;
  if (typeof accuracyM === "number" && accuracyM > effective.accuracyThresholdM) {
    return effective.policy === "block"
      ? accept("unknown", "quarantined", "low_accuracy")
      : accept("unknown", "clean", "low_accuracy");
  }

  // --- Genuinely outside --------------------------------------------------
  if (effective.policy === "record_only") return accept("outside", "clean", "outside_zone");
  if (effective.policy === "warn") return accept("outside", "warned", "outside_zone");

  // policy === "block".
  // An offline replay is accepted-and-quarantined rather than refused: the
  // client already ran this same evaluation and either passed or collected
  // an override, and the service worker drops 4xx on replay — refusing here
  // would silently destroy the worker's record of time they worked.
  if (input.isReplay) {
    return accept("outside", "quarantined", "offline_replay_unverified");
  }
  if (isUsableOverrideReason(input.overrideReason)) {
    return accept("outside", "quarantined", "worker_override");
  }
  return {
    ...base,
    outcome: "block",
    geofenceState: "outside",
    enforcementState: "clean",
    reason: "outside_zone",
    overrideAvailable: true,
  };
}

/** Operator-facing copy for a blocked punch. */
export function blockMessage(evaluation: PunchEvaluation): string {
  const where = evaluation.nearestZoneName ?? "your work site";
  const distance =
    typeof evaluation.distanceM === "number" ? `${Math.round(evaluation.distanceM)} m from ${where}` : `away from ${where}`;
  return `You're ${distance}. Clock in when you're on site, or add a reason to punch anyway.`;
}
