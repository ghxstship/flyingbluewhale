import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pushKindForEvent } from "./notify";
import { WEBHOOK_EVENTS } from "./webhooks/events";
import { NOTIF_KINDS, NOTIF_KIND_FALLBACKS } from "@/components/notifications/kinds";

/**
 * Guards the fix for TIME_LIFECYCLE_BACKLOG #11.
 *
 * The defect the doc described was "these events can't be muted". The defect
 * that was actually there was the inverse: `notify()` gated push on
 * `user_preferences.ui_state.notifications` — a store retired as a placebo,
 * whose push default is false — so the events never pushed at all. Both
 * failure modes are asserted here, because the fix for one is the other's
 * regression:
 *
 *   - an event that SHOULD push but doesn't  -> the dead-gate defect
 *   - an event that pushes with no PushKind  -> unmutable (filterByPushPrefs
 *     excludes nobody without a kind), which is what the doc feared
 */

const TIME_AND_PAY_EVENTS = [
  "timesheet.submitted",
  "timesheet.approved",
  "timesheet.rejected",
  "timesheet.posted",
  "payroll.posted",
  "time.correction_requested",
  "time.correction_decided",
] as const;

describe("notify push-kind map", () => {
  it("maps every time & pay event to a PushKind", () => {
    for (const event of TIME_AND_PAY_EVENTS) {
      expect(pushKindForEvent(event), `${event} must push`).toBeDefined();
    }
  });

  it("only maps events onto kinds a user can actually toggle", () => {
    // A kind absent from NOTIF_KINDS renders no switch, so pushing it would
    // be unmutable in practice even though it carries a kind.
    for (const event of TIME_AND_PAY_EVENTS) {
      const kind = pushKindForEvent(event);
      expect(NOTIF_KINDS, `${event} -> ${kind} must be toggleable`).toContain(kind);
    }
  });

  it("maps every mapped event — not just time & pay — onto a toggleable kind", () => {
    // Generalization of the assertion above: as owners opt more events into
    // push (memory: project-notify-push-dead-store says "map as owners
    // decide, never in bulk"), each new mapping must land on a kind that
    // renders a switch, or it ships an unmutable push.
    for (const event of WEBHOOK_EVENTS) {
      const kind = pushKindForEvent(event);
      if (kind !== undefined) {
        expect(NOTIF_KINDS, `${event} -> ${kind} must be toggleable`).toContain(kind);
      }
    }
  });

  it("never re-gates push on the retired ui_state.notifications store", () => {
    // The F2 defect: notify() called shouldNotify(uid, event, "push") — a
    // store no UI writes, whose push default was false — so push never
    // fired for anyone. The fix removed that gate and narrowed
    // NotifyChannel to "in_app" | "email" (compile-time ratchet). This
    // source scan is the second, independent guard: it fails if anyone
    // re-widens the channel type AND reintroduces the dead gate in the
    // same commit — the exact path a notify() push could go dead by again.
    const notifySrc = readFileSync(join(process.cwd(), "src/lib/notify.ts"), "utf8");
    const resolverSrc = readFileSync(join(process.cwd(), "src/lib/notify-resolver.ts"), "utf8");
    expect(
      /(?:bulkShouldNotify|shouldNotify)\s*\([^)]*["']push["']/.test(notifySrc),
      "notify.ts must never gate push on the retired resolver — push resolves via NOTIFY_EVENT_PUSH_KIND + notification_preferences (sendPushTo)",
    ).toBe(false);
    expect(
      /NotifyChannel\s*=[^;]*["']push["']/.test(resolverSrc),
      'the retired resolver must not offer a "push" channel (NotifyChannel is the compile-time ratchet)',
    ).toBe(false);
  });

  it("does not push events it has no kind for", () => {
    // The map is opt-in on purpose: handing sendPushTo an undefined kind makes
    // filterByPushPrefs exclude nobody, i.e. an unmutable push.
    expect(pushKindForEvent("invoice.paid" as never)).toBeUndefined();
  });

  it("lists each kind exactly once", () => {
    // Two sessions added `timesheet` minutes apart and git auto-merged both
    // additions with NO conflict. The duplicate object key was a type error
    // (TS1117), but a duplicate tuple entry and a duplicate fallback row are
    // both type-LEGAL — they render the same switch twice. tsc cannot see
    // this; only an assertion can.
    expect(NOTIF_KINDS.length, "duplicate kind in NOTIF_KINDS").toBe(new Set(NOTIF_KINDS).size);
    const fallbackKinds = NOTIF_KIND_FALLBACKS.map((r) => r.kind);
    expect(fallbackKinds.length, "duplicate kind in NOTIF_KIND_FALLBACKS").toBe(new Set(fallbackKinds).size);
  });

  it("gives every toggleable kind a fallback row", () => {
    // The matrix renders from the view; the fallbacks are what a user sees
    // when that read fails. A kind missing here renders no switch on a blip.
    for (const kind of NOTIF_KINDS) {
      expect(
        NOTIF_KIND_FALLBACKS.some((r) => r.kind === kind),
        `${kind} has no fallback row`,
      ).toBe(true);
    }
  });

  it("keeps the catalog view in lockstep with NOTIF_KINDS", () => {
    // The third leg of the mirror. send.ts <-> kinds.ts is compiler-enforced
    // (`satisfies` + the Exclude assertion); the view is not, so assert it.
    // Reads the EFFECTIVE view definition dynamically — the LATEST migration
    // that redefines `notification_kind_catalog` (timestamp-prefixed names
    // sort chronologically). Hardcoding a path went stale the moment a new
    // kind (`shift`, 20260718022624) redefined the view in a later migration.
    const migDir = join(process.cwd(), "supabase/migrations");
    const latest = readdirSync(migDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .reverse()
      .find((f) => /create\s+or\s+replace\s+view\s+public\.notification_kind_catalog/i.test(
        readFileSync(join(migDir, f), "utf8"),
      ));
    expect(latest, "no migration defines notification_kind_catalog").toBeTruthy();
    const sql = readFileSync(join(migDir, latest!), "utf8");
    for (const kind of NOTIF_KINDS) {
      expect(sql, `${kind} missing from the latest notification_kind_catalog (${latest})`).toContain(
        `('${kind}'::text,`,
      );
    }
  });
});
