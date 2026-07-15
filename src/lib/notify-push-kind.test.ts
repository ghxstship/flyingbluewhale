import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pushKindForEvent } from "./notify";
import { NOTIF_KINDS } from "@/components/notifications/kinds";

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

  it("does not push events it has no kind for", () => {
    // The map is opt-in on purpose: handing sendPushTo an undefined kind makes
    // filterByPushPrefs exclude nobody, i.e. an unmutable push.
    expect(pushKindForEvent("invoice.paid" as never)).toBeUndefined();
  });

  it("keeps the catalog view in lockstep with NOTIF_KINDS", () => {
    // The third leg of the mirror. send.ts <-> kinds.ts is compiler-enforced
    // (`satisfies` + the Exclude assertion); the view is not, so assert it.
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260716010000_notification_kinds_time_and_pay.sql"),
      "utf8",
    );
    for (const kind of NOTIF_KINDS) {
      expect(sql, `${kind} missing from notification_kind_catalog`).toContain(`('${kind}',`);
    }
  });
});
