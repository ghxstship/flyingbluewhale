import { describe, it, expect, beforeEach, vi } from "vitest";

// =============================================================================
// Per-kind push-preference gating (filterByPushPrefs via the sendPushTo /
// sendPushBulk public surface). web-push is fully mocked — no network.
//
// In-memory fake of the service-role client covering the four tables the
// send pipeline touches: notification_preferences (pref gate reads),
// push_subscriptions (active-device reads + last_seen/failure writes),
// notifications (bell rows), push_send_failures (retry queue).
// =============================================================================

type Row = Record<string, unknown>;

function makeFake() {
  const state = {
    prefs: [] as Array<{ user_id: string; matrix: Record<string, { push?: boolean }> | null }>,
    subs: [] as Row[],
    notifications: [] as Row[],
    queriedTables: [] as string[],
    flags: { vapid: true },
  };

  function from(table: string) {
    state.queriedTables.push(table);
    const filters: Array<[op: string, col: string, val: unknown]> = [];

    const exec = async (): Promise<{ data: Row[] | null; error: null }> => {
      if (table === "notification_preferences") {
        const inFilter = filters.find(([op]) => op === "in");
        const ids = (inFilter?.[2] as string[]) ?? [];
        return { data: state.prefs.filter((p) => ids.includes(p.user_id)), error: null };
      }
      if (table === "push_subscriptions") {
        let rows = state.subs;
        for (const [op, col, val] of filters) {
          if (op === "eq") rows = rows.filter((r) => r[col] === val);
          if (op === "in") rows = rows.filter((r) => (val as unknown[]).includes(r[col]));
          if (op === "is") rows = rows.filter((r) => r[col] == null);
        }
        return { data: rows, error: null };
      }
      return { data: null, error: null };
    };

    const builder = {
      select: (..._args: unknown[]) => builder,
      insert: (rows: Row | Row[]) => {
        if (table === "notifications") state.notifications.push(...(Array.isArray(rows) ? rows : [rows]));
        return builder;
      },
      update: (_patch: Row) => builder,
      eq: (col: string, val: unknown) => {
        filters.push(["eq", col, val]);
        return builder;
      },
      is: (col: string, val: unknown) => {
        filters.push(["is", col, val]);
        return builder;
      },
      in: (col: string, val: unknown) => {
        filters.push(["in", col, val]);
        return builder;
      },
      returns: () => builder,
      then: <T>(resolve: (v: { data: Row[] | null; error: null }) => T, reject?: (e: unknown) => unknown) =>
        exec().then(resolve, reject),
    };
    return builder;
  }

  return { state, client: { from } };
}

const fake = makeFake();
const sendNotificationMock = vi.fn(async (..._args: unknown[]) => undefined);

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
  },
}));

vi.mock("@/lib/push/vapid", () => ({
  hasVapid: () => fake.state.flags.vapid,
  vapid: () => ({ subject: "mailto:test@atlvs.pro", publicKey: "pk", privateKey: "sk" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => fake.client,
  createClient: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { sendPushTo, sendPushBulk } from "./send";
import { pushKindForEvent } from "../notify";

function seedSub(userId: string, id = `sub-${userId}`): void {
  fake.state.subs.push({
    id,
    user_id: userId,
    endpoint: `https://push.example/${id}`,
    p256dh: "p",
    auth: "a",
    failure_count: 0,
    disabled_at: null,
  });
}

beforeEach(() => {
  fake.state.prefs.length = 0;
  fake.state.subs.length = 0;
  fake.state.notifications.length = 0;
  fake.state.queriedTables.length = 0;
  fake.state.flags.vapid = true;
  sendNotificationMock.mockClear();
});

describe("sendPushTo — preference gating", () => {
  // NOTE: this test must run first — ensureVapid() caches a successful
  // configuration at module level, so the unconfigured path is only
  // reachable before any test sends with VAPID enabled.
  it("no-ops the push channel when VAPID is unconfigured, but still records the bell row", async () => {
    fake.state.flags.vapid = false;
    seedSub("u1");
    const result = await sendPushTo("u1", { title: "T", body: "B", kind: "assignment" });
    expect(result).toEqual({ sent: 0, failed: 0, disabled: 0 });
    expect(sendNotificationMock).not.toHaveBeenCalled();
    expect(fake.state.notifications).toHaveLength(1);
  });

  it("short-circuits when the user toggled the kind off — bell row still written", async () => {
    seedSub("u1");
    fake.state.prefs.push({ user_id: "u1", matrix: { assignment: { push: false } } });

    const result = await sendPushTo("u1", { title: "T", body: "B", kind: "assignment" });

    expect(result).toEqual({ sent: 0, failed: 0, disabled: 0 });
    expect(sendNotificationMock).not.toHaveBeenCalled();
    expect(fake.state.notifications).toHaveLength(1);
    expect(fake.state.notifications[0]).toMatchObject({ user_id: "u1", kind: "assignment" });
  });

  it("defaults to allowed when the user has no prefs row", async () => {
    seedSub("u1");
    const result = await sendPushTo("u1", { title: "T", body: "B", kind: "assignment" });
    expect(result).toEqual({ sent: 1, failed: 0, disabled: 0 });
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
  });

  it("delivers a time & pay event to a user with NO preference row (TIME_LIFECYCLE_BACKLOG #11)", async () => {
    // The regression this pins: notify() used to gate push on the retired
    // user_preferences.ui_state store, whose push default was FALSE — so
    // timesheet/payroll pushes never fired for anyone, and a user with no
    // preference row was silence, not default-on. The fixed path is
    // notify() -> NOTIFY_EVENT_PUSH_KIND -> sendPushTo(kind), where the live
    // matrix is default-on and only an explicit push:false excludes. This
    // test walks that exact chain: the real event->kind map feeding the real
    // pref gate, with zero notification_preferences rows seeded.
    seedSub("u1");
    const kind = pushKindForEvent("timesheet.submitted");
    expect(kind).toBe("timesheet");

    const result = await sendPushTo("u1", { title: "Timesheet submitted", body: "40h", kind });

    expect(result).toEqual({ sent: 1, failed: 0, disabled: 0 });
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    // And the mute switch stays real: an explicit opt-out silences the kind.
    sendNotificationMock.mockClear();
    fake.state.prefs.push({ user_id: "u1", matrix: { timesheet: { push: false } } });
    const muted = await sendPushTo("u1", { title: "Timesheet submitted", body: "40h", kind });
    expect(muted.sent).toBe(0);
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it("defaults to allowed when the matrix has no entry for the kind", async () => {
    seedSub("u1");
    fake.state.prefs.push({ user_id: "u1", matrix: { chat: { push: false } } });
    const result = await sendPushTo("u1", { title: "T", body: "B", kind: "assignment" });
    expect(result.sent).toBe(1);
  });

  it("bypasses the prefs read entirely when the payload has no kind", async () => {
    seedSub("u1");
    // Even an everything-off matrix can't mute a kindless system ping.
    fake.state.prefs.push({ user_id: "u1", matrix: { assignment: { push: false }, chat: { push: false } } });

    const result = await sendPushTo("u1", { title: "Security", body: "Alert" });

    expect(result.sent).toBe(1);
    expect(fake.state.queriedTables).not.toContain("notification_preferences");
  });

  it("skips the bell row when recordBell is false", async () => {
    seedSub("u1");
    await sendPushTo("u1", { title: "T", body: "B", kind: "assignment" }, { recordBell: false });
    expect(fake.state.notifications).toHaveLength(0);
  });
});

describe("sendPushBulk — preference gating", () => {
  it("drops opted-out users from delivery but writes bell rows for everyone", async () => {
    seedSub("u-muted");
    seedSub("u-open");
    fake.state.prefs.push({ user_id: "u-muted", matrix: { kudos: { push: false } } });

    const result = await sendPushBulk(["u-muted", "u-open"], { title: "T", body: "B", kind: "kudos" });

    expect(result).toEqual({ sent: 1, failed: 0, disabled: 0 });
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    const [subscription] = sendNotificationMock.mock.calls[0] as [{ endpoint: string }, string];
    expect(subscription.endpoint).toContain("sub-u-open");
    expect(fake.state.notifications).toHaveLength(2);
  });
});
