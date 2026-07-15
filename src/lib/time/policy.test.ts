import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORG_TIME_SETTINGS,
  evaluatePunch,
  isUsableOverrideReason,
  resolveEffectivePolicy,
  type OrgTimeSettings,
  type PolicyZone,
} from "./policy";

const CENTER = { lat: 25.7617, lng: -80.1918 };

const gate: PolicyZone = {
  id: "gate",
  name: "Load-In Gate",
  center_lat: CENTER.lat,
  center_lng: CENTER.lng,
  radius_m: 150,
};

/** ~2 km north — comfortably outside `gate` under any grace. */
const FAR = { lat: 25.78, lng: -80.1918 };

function settings(over: Partial<OrgTimeSettings> = {}): OrgTimeSettings {
  return { ...DEFAULT_ORG_TIME_SETTINGS, ...over };
}

describe("resolveEffectivePolicy", () => {
  it("falls back to the org default when the zone does not override", () => {
    expect(resolveEffectivePolicy(gate, settings({ geofence_policy: "warn" })).policy).toBe("warn");
  });

  it("lets a zone override the org", () => {
    const strict: PolicyZone = { ...gate, geofence_policy: "block" };
    expect(resolveEffectivePolicy(strict, settings({ geofence_policy: "record_only" })).policy).toBe("block");
  });

  it("treats a null zone column as inherit, not as a value", () => {
    const zone: PolicyZone = { ...gate, geofence_policy: null, grace_radius_m: null };
    const s = settings({ geofence_policy: "block", grace_radius_m: 25 });
    expect(resolveEffectivePolicy(zone, s)).toMatchObject({ policy: "block", graceRadiusM: 25 });
  });

  it("falls back to record_only with no zone and no settings", () => {
    expect(resolveEffectivePolicy(null).policy).toBe("record_only");
  });
});

describe("evaluatePunch", () => {
  describe("record_only — today's behaviour, and the default", () => {
    it("accepts an outside punch and records it, exactly as before Phase 1", () => {
      const r = evaluatePunch({ fix: { ...FAR, accuracyM: 5 }, zones: [gate] });
      expect(r).toMatchObject({
        outcome: "accept",
        geofenceState: "outside",
        enforcementState: "clean",
        policy: "record_only",
      });
    });

    it("accepts an inside punch as clean", () => {
      const r = evaluatePunch({ fix: { ...CENTER, accuracyM: 5 }, zones: [gate] });
      expect(r).toMatchObject({ outcome: "accept", geofenceState: "inside", enforcementState: "clean" });
      expect(r.zoneId).toBe("gate");
    });
  });

  describe("warn", () => {
    it("accepts an outside punch but flags it", () => {
      const r = evaluatePunch({
        fix: { ...FAR, accuracyM: 5 },
        zones: [gate],
        settings: settings({ geofence_policy: "warn" }),
      });
      expect(r).toMatchObject({ outcome: "accept", geofenceState: "outside", enforcementState: "warned" });
    });
  });

  describe("block", () => {
    const blocking = settings({ geofence_policy: "block" });

    it("blocks an outside punch and always offers an override", () => {
      const r = evaluatePunch({ fix: { ...FAR, accuracyM: 5 }, zones: [gate], settings: blocking });
      expect(r.outcome).toBe("block");
      expect(r.overrideAvailable).toBe(true);
      expect(r.reason).toBe("outside_zone");
    });

    it("reports the nearest zone and distance so the worker is told where to go", () => {
      const r = evaluatePunch({ fix: { ...FAR, accuracyM: 5 }, zones: [gate], settings: blocking });
      expect(r.nearestZoneName).toBe("Load-In Gate");
      expect(r.distanceM).toBeGreaterThan(150);
    });

    it("still accepts an inside punch", () => {
      const r = evaluatePunch({ fix: { ...CENTER, accuracyM: 5 }, zones: [gate], settings: blocking });
      expect(r.outcome).toBe("accept");
    });

    // The FLSA rule: blocking must never destroy a record of worked time.
    it("accepts an override with a reason, quarantined for review", () => {
      const r = evaluatePunch({
        fix: { ...FAR, accuracyM: 5 },
        zones: [gate],
        settings: blocking,
        overrideReason: "Gate 3 is closed, crew staged at the north lot per Dana",
      });
      expect(r).toMatchObject({
        outcome: "accept",
        geofenceState: "outside",
        enforcementState: "quarantined",
        reason: "worker_override",
      });
    });

    it("does not accept a token override reason", () => {
      const r = evaluatePunch({
        fix: { ...FAR, accuracyM: 5 },
        zones: [gate],
        settings: blocking,
        overrideReason: "x",
      });
      expect(r.outcome).toBe("block");
    });

    it("never leaves a worker with no way to record time", () => {
      // Exhaustive over the shapes a punch can take under the strictest
      // policy: every one either accepts, or blocks WITH an override.
      const fixes = [null, { ...FAR, accuracyM: 5 }, { ...CENTER, accuracyM: 5 }, { ...FAR, accuracyM: 900 }];
      for (const fix of fixes) {
        for (const zones of [[], [gate]]) {
          const r = evaluatePunch({ fix, zones, settings: blocking });
          expect(r.outcome === "accept" || r.overrideAvailable, JSON.stringify({ fix, zones })).toBe(true);
        }
      }
    });
  });

  describe("the GPS-denied and zero-zone paths are never hard locks", () => {
    const blocking = settings({ geofence_policy: "block" });

    it("accepts a GPS-less punch under block, quarantined", () => {
      const r = evaluatePunch({ fix: null, zones: [gate], settings: blocking });
      expect(r).toMatchObject({
        outcome: "accept",
        geofenceState: "unknown",
        enforcementState: "quarantined",
        reason: "no_fix",
      });
    });

    // The zero-zone defect, now load-bearing: with block enabled, an org
    // that never configured zones would otherwise lock out every worker.
    it("accepts every punch in an org with no zones, even under block", () => {
      const r = evaluatePunch({ fix: { ...CENTER, accuracyM: 5 }, zones: [], settings: blocking });
      expect(r).toMatchObject({
        outcome: "accept",
        geofenceState: "unknown",
        reason: "no_zones_configured",
      });
    });

    it("leaves GPS-less punches clean under record_only rather than flagging them", () => {
      const r = evaluatePunch({ fix: null, zones: [gate] });
      expect(r.enforcementState).toBe("clean");
    });
  });

  describe("accuracy gate", () => {
    const blocking = settings({ geofence_policy: "block", accuracy_threshold_m: 100 });

    it("does not block on a fix too vague to prove absence", () => {
      const r = evaluatePunch({ fix: { ...FAR, accuracyM: 500 }, zones: [gate], settings: blocking });
      expect(r).toMatchObject({
        outcome: "accept",
        geofenceState: "unknown",
        enforcementState: "quarantined",
        reason: "low_accuracy",
      });
    });

    it("blocks the same location when the fix is precise", () => {
      const r = evaluatePunch({ fix: { ...FAR, accuracyM: 8 }, zones: [gate], settings: blocking });
      expect(r.outcome).toBe("block");
    });

    it("treats an unreported accuracy as unverified rather than precise", () => {
      // No accuracyM at all: we can't claim the fix is good, so an outside
      // verdict still stands, but it is the caller's threshold that decides.
      const r = evaluatePunch({ fix: { ...FAR }, zones: [gate], settings: blocking });
      expect(r.outcome).toBe("block");
      expect(r.overrideAvailable).toBe(true);
    });

    it("honours a per-zone accuracy override", () => {
      const loose: PolicyZone = { ...gate, accuracy_threshold_m: 1000 };
      const r = evaluatePunch({ fix: { ...FAR, accuracyM: 500 }, zones: [loose], settings: blocking });
      expect(r.outcome).toBe("block");
    });
  });

  describe("grace radius", () => {
    // 0.0018 deg lat ~= 200 m north of center: outside the 150 m radius,
    // inside 150 + 100.
    const justOutside = { lat: CENTER.lat + 0.0018, lng: CENTER.lng, accuracyM: 5 };

    it("accepts a near-miss as inside but flags it warned, not clean", () => {
      const r = evaluatePunch({
        fix: justOutside,
        zones: [gate],
        settings: settings({ geofence_policy: "block", grace_radius_m: 100 }),
      });
      expect(r).toMatchObject({
        outcome: "accept",
        geofenceState: "inside",
        enforcementState: "warned",
        reason: "inside_grace",
      });
      expect(r.zoneId).toBe("gate");
    });

    it("blocks the same punch when grace is off", () => {
      const r = evaluatePunch({
        fix: justOutside,
        zones: [gate],
        settings: settings({ geofence_policy: "block", grace_radius_m: 0 }),
      });
      expect(r.outcome).toBe("block");
    });

    it("prefers a true containment over a grace containment", () => {
      // `other` truly contains the punch; `gate` only grazes it.
      const other: PolicyZone = {
        id: "other",
        name: "North Lot",
        center_lat: justOutside.lat,
        center_lng: justOutside.lng,
        radius_m: 50,
      };
      const r = evaluatePunch({
        fix: justOutside,
        zones: [gate, other],
        settings: settings({ grace_radius_m: 100 }),
      });
      expect(r.zoneId).toBe("other");
      expect(r.enforcementState).toBe("clean");
    });
  });

  describe("offline replay", () => {
    const blocking = settings({ geofence_policy: "block" });

    // The service worker drops 4xx terminally on replay, so a refusal here
    // would silently destroy the punch. Accept and quarantine instead.
    it("never refuses a replayed punch that would have been blocked", () => {
      const r = evaluatePunch({ fix: { ...FAR, accuracyM: 5 }, zones: [gate], settings: blocking, isReplay: true });
      expect(r).toMatchObject({
        outcome: "accept",
        enforcementState: "quarantined",
        reason: "offline_replay_unverified",
      });
    });

    it("does not quarantine a replayed punch that is genuinely inside", () => {
      const r = evaluatePunch({ fix: { ...CENTER, accuracyM: 5 }, zones: [gate], settings: blocking, isReplay: true });
      expect(r.enforcementState).toBe("clean");
    });
  });
});

describe("isUsableOverrideReason", () => {
  it("rejects empty, whitespace, and stubs", () => {
    for (const r of [null, undefined, "", "   ", "ok", "asdf"]) {
      expect(isUsableOverrideReason(r as string | null)).toBe(false);
    }
  });

  it("accepts a real explanation", () => {
    expect(isUsableOverrideReason("Gate 3 closed, staged at north lot")).toBe(true);
  });
});
