import "server-only";

import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { blockMessage, evaluatePunch, type EnforcementState, type PunchFix } from "@/lib/time/policy";
import { loadPunchPolicyContext } from "@/lib/time/server";
import { resolveZoneForPunch } from "@/lib/workforce";
import { hashDeviceToken, isPlausibleDeviceToken } from "./device-token";
import { isLockedOut, lockoutRemainingS, registerPinFailure } from "./lockout";
import { KIOSK_PIN_RE, pinLookupDigest, verifyPin } from "./pins";

/**
 * T1-4 kiosk mode — server-side resolution + punch execution.
 *
 * Everything here runs under the SERVICE client: a kiosk tablet carries no
 * user session, only its device-token cookie. The buddy-punch discipline
 * (capability ≠ authorization) is enforced structurally — the device token is
 * only a capability to PRESENT a PIN/pass, and each punch re-resolves exactly
 * one worker identity server-side. The client never supplies a user id.
 *
 * Punch execution deliberately mirrors `/api/v1/time/clock` over the SAME
 * shared policy primitives (`loadPunchPolicyContext`, `evaluatePunch`,
 * `resolveZoneForPunch`) — the same relationship `/api/v1/shifts/checkin`
 * already has to that route. Provenance differs: `source_channel='kiosk'` +
 * `kiosk_device_id` on the entry.
 */

type Db = ReturnType<typeof createServiceClient>;

export type KioskDevice = {
  id: string;
  orgId: string;
  projectId: string | null;
  label: string;
  failedPinAttempts: number;
  pinLockedUntil: string | null;
};

export type KioskWorker = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

export type KioskPunchState = { clockedIn: boolean; onBreak: boolean };

export type KioskIdentifyResult =
  | { ok: true; worker: KioskWorker; punchState: KioskPunchState }
  | {
      ok: false;
      code: "locked" | "pin_invalid" | "pass_invalid" | "pass_unlinked" | "not_configured";
      /** Seconds until the device's PIN pad unlocks (locked / just-locked). */
      retryAfterS?: number;
    };

/**
 * The PIN pepper. Prod must set `KIOSK_PIN_SECRET`; dev falls back to a
 * deterministic value so local PINs survive restarts. Absent in prod → the
 * PIN flow reports `not_configured` (the pass-QR flow needs no pepper).
 */
export function kioskPinSecret(): string | null {
  return (
    env.KIOSK_PIN_SECRET ??
    (process.env.NODE_ENV === "development" ? "dev-only-kiosk-pin-secret-do-not-use-in-prod" : null)
  );
}

/** True when the kiosk backend can run at all (service role configured). */
export function isKioskAvailable(): boolean {
  return isServiceClientAvailable();
}

/**
 * Resolve a raw device-token cookie → the active registered device.
 * Also stamps `last_seen_at` (best-effort) so the manager surface can spot
 * dead tablets.
 */
export async function resolveKioskDevice(rawToken: string | undefined | null): Promise<KioskDevice | null> {
  if (!isPlausibleDeviceToken(rawToken) || !isServiceClientAvailable()) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("kiosk_devices")
    .select("id, org_id, project_id, label, active, failed_pin_attempts, pin_locked_until")
    .eq("device_token_hash", hashDeviceToken(rawToken))
    .eq("active", true)
    .maybeSingle();
  if (!data) return null;

  // Best-effort heartbeat; a failure must never refuse the kiosk.
  const { error: seenErr } = await supabase
    .from("kiosk_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id as string);
  if (seenErr) log.warn("kiosk.device.heartbeat_failed", { device_id: data.id, err: seenErr.message });

  return {
    id: data.id as string,
    orgId: data.org_id as string,
    projectId: (data.project_id as string | null) ?? null,
    label: data.label as string,
    failedPinAttempts: (data.failed_pin_attempts as number) ?? 0,
    pinLockedUntil: (data.pin_locked_until as string | null) ?? null,
  };
}

/** The worker's identity card — requires a LIVE membership in the device org. */
async function loadWorkerIdentity(supabase: Db, orgId: string, userId: string): Promise<KioskWorker | null> {
  const { data } = await supabase
    .from("memberships")
    .select("role, users!inner(id, name, email, avatar_url)")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const user = data.users as unknown as { id: string; name: string | null; email: string; avatar_url: string | null };
  return {
    userId,
    name: user.name || user.email.split("@")[0] || user.email,
    email: user.email,
    avatarUrl: user.avatar_url ?? null,
    role: (data.role as string) ?? "member",
  };
}

/** The worker's current open shift entry (task timers excluded — clock canon). */
async function loadPunchState(supabase: Db, orgId: string, userId: string): Promise<KioskPunchState> {
  const open = await readOpenEntry(supabase, orgId, userId);
  return { clockedIn: Boolean(open), onBreak: Boolean(open?.break_open_at) };
}

type OpenEntry = { id: string; started_at: string; break_open_at: string | null; break_minutes: number | null };

async function readOpenEntry(supabase: Db, orgId: string, userId: string): Promise<OpenEntry | null> {
  const { data } = await supabase
    .from("time_entries")
    .select("id, started_at, break_open_at, break_minutes")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .neq("activity_category", "task")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as OpenEntry | null) ?? null;
}

/** Persist a device lockout-counter change. Best-effort but logged. */
async function writeDeviceAttempts(
  supabase: Db,
  deviceId: string,
  failedAttempts: number,
  lockedUntil: Date | null,
): Promise<void> {
  const { error } = await supabase
    .from("kiosk_devices")
    .update({ failed_pin_attempts: failedAttempts, pin_locked_until: lockedUntil?.toISOString() ?? null })
    .eq("id", deviceId);
  if (error) log.error("kiosk.device.attempts_write_failed", { device_id: deviceId, err: error.message });
}

/**
 * PIN → worker. Device-scoped lockout applies BEFORE any lookup; a mismatch
 * increments the device counter (a failed PIN identifies nobody, so the
 * device is the only attributable unit). Success resets the counter.
 */
export async function identifyByPin(device: KioskDevice, pin: string): Promise<KioskIdentifyResult> {
  const now = new Date();
  if (isLockedOut(device.pinLockedUntil, now)) {
    return { ok: false, code: "locked", retryAfterS: lockoutRemainingS(device.pinLockedUntil, now) };
  }
  // Malformed input can never match a stored 4-6 digit PIN — reject without
  // burning an attempt (the pad enforces format; junk here is not a guess).
  if (!KIOSK_PIN_RE.test(pin)) return { ok: false, code: "pin_invalid" };

  const secret = kioskPinSecret();
  if (!secret) return { ok: false, code: "not_configured" };

  const supabase = createServiceClient();
  const digest = pinLookupDigest(device.orgId, pin, secret);
  const { data: row } = await supabase
    .from("kiosk_worker_pins")
    .select("user_id, pin_hash")
    .eq("org_id", device.orgId)
    .eq("pin_lookup_digest", digest)
    .eq("active", true)
    .maybeSingle();

  const matched = row && verifyPin(pin, row.pin_hash as string) ? row : null;
  if (!matched) {
    const next = registerPinFailure(device.failedPinAttempts, now);
    await writeDeviceAttempts(supabase, device.id, next.failedAttempts, next.lockedUntil);
    if (next.lockedUntil) {
      return { ok: false, code: "locked", retryAfterS: lockoutRemainingS(next.lockedUntil, now) };
    }
    return { ok: false, code: "pin_invalid" };
  }

  const userId = matched.user_id as string;
  const worker = await loadWorkerIdentity(supabase, device.orgId, userId);
  // A PIN whose holder is no longer a live member must not punch — same
  // refusal as an unknown PIN, and it still clears honest attempts? No:
  // treat as invalid WITHOUT reset (the entry did not identify a worker).
  if (!worker) return { ok: false, code: "pin_invalid" };

  if (device.failedPinAttempts > 0 || device.pinLockedUntil) {
    await writeDeviceAttempts(supabase, device.id, 0, null);
  }
  const { error: usedErr } = await supabase
    .from("kiosk_worker_pins")
    .update({ last_used_at: now.toISOString() })
    .eq("org_id", device.orgId)
    .eq("user_id", userId);
  if (usedErr) log.warn("kiosk.pin.last_used_write_failed", { err: usedErr.message });

  return { ok: true, worker, punchState: await loadPunchState(supabase, device.orgId, userId) };
}

/**
 * Pass QR → worker, through the assignments domain: the Rose pass renders the
 * holder's real active `assignment_scan_codes` code. Resolution only — the
 * credential is identified, never redeemed/consumed here.
 */
export async function identifyByPassCode(device: KioskDevice, code: string): Promise<KioskIdentifyResult> {
  const trimmed = code.trim();
  if (!trimmed || trimmed.length > 200 || !isServiceClientAvailable()) {
    return { ok: false, code: "pass_invalid" };
  }
  const supabase = createServiceClient();

  const { data: scanCode } = await supabase
    .from("assignment_scan_codes")
    .select("assignment_id")
    .eq("org_id", device.orgId)
    .eq("code", trimmed)
    .eq("active", true)
    .maybeSingle();
  if (!scanCode) return { ok: false, code: "pass_invalid" };

  const { data: assignment } = await supabase
    .from("assignments")
    .select("party_kind, party_user_id, party_crew_id, fulfillment_state")
    .eq("id", scanCode.assignment_id as string)
    .eq("org_id", device.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!assignment) return { ok: false, code: "pass_invalid" };
  const state = assignment.fulfillment_state as string;
  if (state === "voided" || state === "expired") return { ok: false, code: "pass_invalid" };

  // Exactly-one-of party model → at most one auth user behind the pass.
  let userId: string | null = null;
  if (assignment.party_kind === "user") {
    userId = (assignment.party_user_id as string | null) ?? null;
  } else if (assignment.party_kind === "crew_member" && assignment.party_crew_id) {
    const { data: crew } = await supabase
      .from("crew_members")
      .select("user_id")
      .eq("id", assignment.party_crew_id as string)
      .eq("org_id", device.orgId)
      .maybeSingle();
    userId = (crew?.user_id as string | null) ?? null;
  }
  // External holders (guest tickets) have no platform account: nothing to
  // punch as. Honest, specific refusal.
  if (!userId) return { ok: false, code: "pass_unlinked" };

  const worker = await loadWorkerIdentity(supabase, device.orgId, userId);
  if (!worker) return { ok: false, code: "pass_unlinked" };
  return { ok: true, worker, punchState: await loadPunchState(supabase, device.orgId, userId) };
}

// ---------------------------------------------------------------------------
// Punch execution — mirrors /api/v1/time/clock with kiosk provenance.
// ---------------------------------------------------------------------------

export type KioskClockAction = "clock_in" | "clock_out" | "break_start" | "break_end";

export type KioskPunchInput = {
  device: KioskDevice;
  worker: KioskWorker;
  action: KioskClockAction;
  /** True capture moment (offline replays); defaults to now. */
  at?: string;
  fix: PunchFix;
  overrideReason?: string;
  isReplay?: boolean;
};

export type KioskPunchResult =
  | {
      kind: "ok";
      action: KioskClockAction;
      entryId: string | null;
      geofenceState: string | null;
      zoneName: string | null;
      enforcementState?: EnforcementState;
    }
  | { kind: "conflict"; message: string }
  | {
      kind: "blocked";
      message: string;
      geofenceState: string;
      distanceM: number | null;
      nearestZone: { id: string; name: string | null } | null;
      overrideAvailable: boolean;
    }
  | { kind: "error"; message: string };

/**
 * Best-effort get-or-create of the worker's `parties` row (service-role
 * variant of `ensureMyPartyId` — same reason: compile_timesheets keys sheets
 * on parties(auth_user_id, org_id), so a punch without a party row never
 * gathers into a submittable sheet). A failure must never refuse the punch.
 */
async function ensureWorkerParty(supabase: Db, orgId: string, userId: string, email: string): Promise<void> {
  const { data: existing } = await supabase
    .from("parties")
    .select("id")
    .eq("org_id", orgId)
    .eq("auth_user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return;
  const { error } = await supabase.from("parties").insert({
    org_id: orgId,
    type: "person",
    display_name: email.split("@")[0] || email,
    auth_user_id: userId,
    primary_email: email,
  });
  // Race against a concurrent create is benign; anything else is logged.
  if (error) log.warn("kiosk.punch.party_ensure_failed", { err: error.message });
}

export async function executeKioskPunch(input: KioskPunchInput): Promise<KioskPunchResult> {
  const supabase = createServiceClient();
  const { device, worker } = input;
  const nowIso = input.at ?? new Date().toISOString();

  const open = await readOpenEntry(supabase, device.orgId, worker.userId);

  if (input.action === "clock_in") {
    if (open) return { kind: "conflict", message: "Already clocked in." };

    const { settings, zones } = await loadPunchPolicyContext(supabase, device.orgId);
    const verdict = evaluatePunch({
      fix: input.fix,
      zones,
      settings,
      overrideReason: input.overrideReason,
      isReplay: input.isReplay === true,
    });
    await ensureWorkerParty(supabase, device.orgId, worker.userId, worker.email);

    if (verdict.outcome === "block") {
      return {
        kind: "blocked",
        message: blockMessage(verdict),
        geofenceState: verdict.geofenceState,
        distanceM: verdict.distanceM,
        nearestZone: verdict.nearestZoneId ? { id: verdict.nearestZoneId, name: verdict.nearestZoneName } : null,
        overrideAvailable: verdict.overrideAvailable,
      };
    }

    const { data: entry, error } = await supabase
      .from("time_entries")
      .insert({
        org_id: device.orgId,
        user_id: worker.userId,
        // A project-scoped kiosk stamps its production on the entry.
        project_id: device.projectId,
        started_at: nowIso,
        activity_category: "shift",
        zone_id: verdict.zoneId,
        punch_lat: input.fix?.lat ?? null,
        punch_lng: input.fix?.lng ?? null,
        punch_accuracy_m: input.fix?.accuracyM ?? null,
        geofence_state: verdict.geofenceState,
        enforcement_state: verdict.enforcementState,
        enforcement_reason:
          verdict.enforcementState === "clean" ? null : (input.overrideReason?.trim() ?? verdict.reason),
        source_channel: "kiosk",
        kiosk_device_id: device.id,
      })
      .select("id")
      .maybeSingle();
    if (error) return { kind: "error", message: error.message };
    return {
      kind: "ok",
      action: "clock_in",
      entryId: (entry?.id as string | null) ?? null,
      geofenceState: verdict.geofenceState,
      zoneName: verdict.zoneName,
      enforcementState: verdict.enforcementState,
    };
  }

  if (input.action === "break_start") {
    if (!open) return { kind: "conflict", message: "Not clocked in." };
    if (open.break_open_at) return { kind: "conflict", message: "Already on a break." };
    const { error } = await supabase
      .from("time_entries")
      .update({ break_open_at: nowIso })
      .eq("id", open.id)
      .eq("org_id", device.orgId)
      .eq("user_id", worker.userId);
    if (error) return { kind: "error", message: error.message };
    return { kind: "ok", action: "break_start", entryId: open.id, geofenceState: null, zoneName: null };
  }

  if (input.action === "break_end") {
    if (!open) return { kind: "conflict", message: "Not clocked in." };
    if (!open.break_open_at) return { kind: "conflict", message: "Not on a break." };
    const elapsedMin = Math.max(
      0,
      Math.round((new Date(nowIso).getTime() - new Date(open.break_open_at).getTime()) / 60_000),
    );
    const { error } = await supabase
      .from("time_entries")
      .update({ break_open_at: null, break_minutes: (open.break_minutes ?? 0) + elapsedMin })
      .eq("id", open.id)
      .eq("org_id", device.orgId)
      .eq("user_id", worker.userId);
    if (error) return { kind: "error", message: error.message };
    return { kind: "ok", action: "break_end", entryId: open.id, geofenceState: null, zoneName: null };
  }

  // clock_out — never refused (stranding a worker on the clock is worse than
  // anything a refusal would prevent). duration_minutes is trigger-derived.
  if (!open) return { kind: "conflict", message: "Not clocked in." };
  const zones = input.fix ? (await loadPunchPolicyContext(supabase, device.orgId)).zones : [];
  const outResolution = resolveZoneForPunch(input.fix, zones);
  const breakClose = open.break_open_at
    ? {
        break_open_at: null,
        break_minutes:
          (open.break_minutes ?? 0) +
          Math.max(0, Math.round((new Date(nowIso).getTime() - new Date(open.break_open_at).getTime()) / 60_000)),
      }
    : {};
  const { error } = await supabase
    .from("time_entries")
    .update({
      ended_at: nowIso,
      punch_out_lat: input.fix?.lat ?? null,
      punch_out_lng: input.fix?.lng ?? null,
      punch_out_accuracy_m: input.fix?.accuracyM ?? null,
      geofence_out_state: outResolution.state,
      zone_out_id: outResolution.zone?.id ?? null,
      ...breakClose,
    })
    .eq("id", open.id)
    .eq("org_id", device.orgId)
    .eq("user_id", worker.userId);
  if (error) return { kind: "error", message: error.message };
  return {
    kind: "ok",
    action: "clock_out",
    entryId: open.id,
    geofenceState: outResolution.state,
    zoneName: outResolution.zone?.name ?? null,
  };
}
