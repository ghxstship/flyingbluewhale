import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * The plugin is native-only, so these tests drive the module through mocked
 * boundaries. What's worth pinning isn't the plugin call — it's the two
 * decisions the module makes on its own: that it no-ops honestly off-native
 * rather than pretending, and that re-scheduling replaces instead of
 * stacking a second reminder every time the app opens.
 */

const checkPermissions = vi.fn();
const requestPermissions = vi.fn();
const getPending = vi.fn();
const cancel = vi.fn();
const schedule = vi.fn();

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: { checkPermissions, requestPermissions, getPending, cancel, schedule },
}));

const isNativePlatform = vi.fn();
vi.mock("./permissions", () => ({ isNativePlatform: () => isNativePlatform() }));

const FUTURE = new Date(Date.now() + 2 * 3600_000).toISOString();
const LATER = new Date(Date.now() + 6 * 3600_000).toISOString();
const PAST = new Date(Date.now() - 6 * 3600_000).toISOString();

async function subject() {
  return (await import("./shift-reminders")).scheduleShiftReminders;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  isNativePlatform.mockReturnValue(true);
  checkPermissions.mockResolvedValue({ display: "granted" });
  getPending.mockResolvedValue({ notifications: [] });
  cancel.mockResolvedValue(undefined);
  schedule.mockResolvedValue(undefined);
});
afterEach(() => vi.resetAllMocks());

describe("scheduleShiftReminders", () => {
  it("no-ops on the web rather than pretending it scheduled something", async () => {
    isNativePlatform.mockReturnValue(false);
    const run = await subject();
    // The web has no notification that survives the tab closing; saying so
    // beats a silent success.
    expect(await run([{ shiftId: "s1", startsAt: FUTURE, endsAt: LATER, venueName: "Hialeah" }])).toEqual({
      scheduled: 0,
      skipped: "web",
    });
    expect(schedule).not.toHaveBeenCalled();
  });

  it("reports a refused permission instead of failing silently", async () => {
    checkPermissions.mockResolvedValue({ display: "denied" });
    requestPermissions.mockResolvedValue({ display: "denied" });
    const run = await subject();
    expect(await run([{ shiftId: "s1", startsAt: FUTURE, endsAt: LATER, venueName: null }])).toEqual({
      scheduled: 0,
      skipped: "no_permission",
    });
  });

  it("schedules a start and an end reminder for an upcoming shift", async () => {
    const run = await subject();
    const out = await run([{ shiftId: "s1", startsAt: FUTURE, endsAt: LATER, venueName: "Hialeah" }]);
    expect(out.scheduled).toBe(2);
    const sent = schedule.mock.calls[0]?.[0].notifications as Array<{ body: string; extra: { kind: string } }>;
    expect(sent.map((n) => n.extra.kind).sort()).toEqual(["end", "start"]);
    expect(sent.find((n) => n.extra.kind === "start")?.body).toContain("Hialeah");
  });

  // A "starts in 15 minutes" for a shift that began an hour ago is worse
  // than nothing, and the OS rejects a past fire date anyway.
  it("does not schedule a reminder for a shift that already started", async () => {
    const run = await subject();
    const out = await run([{ shiftId: "s1", startsAt: PAST, endsAt: PAST, venueName: null }]);
    expect(out).toEqual({ scheduled: 0, skipped: "nothing_due" });
    expect(schedule).not.toHaveBeenCalled();
  });

  it("still schedules the clock-out nudge for a shift already underway", async () => {
    const run = await subject();
    const out = await run([{ shiftId: "s1", startsAt: PAST, endsAt: LATER, venueName: null }]);
    // Start is in the past, end is not.
    expect(out.scheduled).toBe(1);
    const sent = schedule.mock.calls[0]?.[0].notifications as Array<{ extra: { kind: string } }>;
    expect(sent[0]?.extra.kind).toBe("end");
  });

  it("omits the clock-out nudge when the shift has no end", async () => {
    const run = await subject();
    const out = await run([{ shiftId: "s1", startsAt: FUTURE, endsAt: null, venueName: null }]);
    expect(out.scheduled).toBe(1);
  });

  // Opening the app repeatedly must not stack duplicates.
  it("cancels its own pending reminders before re-scheduling", async () => {
    const run = await subject();
    const shift = { shiftId: "s1", startsAt: FUTURE, endsAt: LATER, venueName: null };
    await run([shift]);
    const ids = (schedule.mock.calls[0]?.[0].notifications as Array<{ id: number }>).map((n) => n.id);

    vi.clearAllMocks();
    checkPermissions.mockResolvedValue({ display: "granted" });
    getPending.mockResolvedValue({ notifications: ids.map((id) => ({ id })) });
    schedule.mockResolvedValue(undefined);
    cancel.mockResolvedValue(undefined);

    await run([shift]);
    expect(cancel).toHaveBeenCalledWith({ notifications: ids.map((id) => ({ id })) });
  });

  it("never cancels a notification belonging to another feature", async () => {
    const run = await subject();
    getPending.mockResolvedValue({ notifications: [{ id: 999_111_222 }] });
    await run([{ shiftId: "s1", startsAt: FUTURE, endsAt: LATER, venueName: null }]);
    // The stranger's id isn't ours, so it must survive.
    expect(cancel).not.toHaveBeenCalled();
  });

  it("gives the same shift the same notification id every time", async () => {
    const run = await subject();
    const shift = { shiftId: "stable-uuid", startsAt: FUTURE, endsAt: LATER, venueName: null };
    await run([shift]);
    const first = (schedule.mock.calls[0]?.[0].notifications as Array<{ id: number }>).map((n) => n.id);
    vi.clearAllMocks();
    checkPermissions.mockResolvedValue({ display: "granted" });
    getPending.mockResolvedValue({ notifications: [] });
    schedule.mockResolvedValue(undefined);
    await run([shift]);
    const second = (schedule.mock.calls[0]?.[0].notifications as Array<{ id: number }>).map((n) => n.id);
    expect(second).toEqual(first);
  });

  it("keeps ids inside int32 — Capacitor rejects anything larger", async () => {
    const run = await subject();
    await run(
      Array.from({ length: 25 }, (_, i) => ({
        shiftId: `shift-${i}-${"x".repeat(i)}`,
        startsAt: FUTURE,
        endsAt: LATER,
        venueName: null,
      })),
    );
    const ids = (schedule.mock.calls[0]?.[0].notifications as Array<{ id: number }>).map((n) => n.id);
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThan(0);
      expect(id).toBeLessThan(2_147_483_647);
    }
  });

  it("survives an older shell that lacks the plugin", async () => {
    // Remote-loaded JS always has to assume it may be running against a
    // binary older than itself.
    vi.doMock("@capacitor/local-notifications", () => {
      throw new Error("plugin not in this build");
    });
    vi.resetModules();
    const run = (await import("./shift-reminders")).scheduleShiftReminders;
    expect(await run([{ shiftId: "s1", startsAt: FUTURE, endsAt: LATER, venueName: null }])).toEqual({
      scheduled: 0,
      skipped: "plugin_unavailable",
    });
  });
});
