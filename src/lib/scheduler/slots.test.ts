import { describe, expect, it } from "vitest";
import { computeSlots, type SlotEventType, type SlotWindow } from "./slots";

const ET: SlotEventType = {
  duration_minutes: 30,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  min_notice_minutes: 0,
  max_per_day: null,
  timezone: "UTC",
};

// Mon 2026-07-13. weekday(UTC) = 1.
const MONDAY = new Date("2026-07-13T00:00:00Z");
const NOW = new Date("2026-07-12T00:00:00Z");

const NINE_TO_TEN: SlotWindow = { weekday: 1, override_date: null, start_minute: 540, end_minute: 600, is_open: true };

describe("scheduler slot computation (kit 27, Calendly parity)", () => {
  it("emits duration-stepped slots inside a weekly window", () => {
    const slots = computeSlots({ eventType: ET, windows: [NINE_TO_TEN], bookings: [], from: MONDAY, days: 1, now: NOW });
    expect(slots.map((s) => s.toISOString())).toEqual(["2026-07-13T09:00:00.000Z", "2026-07-13T09:30:00.000Z"]);
  });

  it("respects minimum notice", () => {
    const slots = computeSlots({
      eventType: { ...ET, min_notice_minutes: 48 * 60 },
      windows: [NINE_TO_TEN],
      bookings: [],
      from: MONDAY,
      days: 1,
      now: new Date("2026-07-12T00:00:00Z"),
    });
    expect(slots).toEqual([]); // Monday 09:00 is < 48h from Sunday 00:00? 33h — blocked
  });

  it("collides against active bookings, including buffers", () => {
    const slots = computeSlots({
      eventType: { ...ET, buffer_after_minutes: 30 },
      windows: [NINE_TO_TEN],
      bookings: [{ starts_at: "2026-07-13T09:30:00Z", ends_at: "2026-07-13T10:00:00Z", booking_state: "booked" }],
      from: MONDAY,
      days: 1,
      now: NOW,
    });
    // 09:00 + 30min buffer would run into the 09:30 booking; 09:30 is taken.
    expect(slots).toEqual([]);
  });

  it("cancelled bookings do not block", () => {
    const slots = computeSlots({
      eventType: ET,
      windows: [NINE_TO_TEN],
      bookings: [{ starts_at: "2026-07-13T09:00:00Z", ends_at: "2026-07-13T09:30:00Z", booking_state: "cancelled" }],
      from: MONDAY,
      days: 1,
      now: NOW,
    });
    expect(slots).toHaveLength(2);
  });

  it("a closed dated override blocks the whole day", () => {
    const slots = computeSlots({
      eventType: ET,
      windows: [
        NINE_TO_TEN,
        { weekday: null, override_date: "2026-07-13", start_minute: 0, end_minute: 1, is_open: false },
      ],
      bookings: [],
      from: MONDAY,
      days: 1,
      now: NOW,
    });
    expect(slots).toEqual([]);
  });

  it("caps slots per day at max_per_day minus existing bookings", () => {
    const slots = computeSlots({
      eventType: { ...ET, max_per_day: 1 },
      windows: [NINE_TO_TEN],
      bookings: [],
      from: MONDAY,
      days: 1,
      now: NOW,
    });
    expect(slots).toHaveLength(1);
  });

  it("converts wall-clock windows through a DST-observing timezone", () => {
    // America/New_York on 2026-07-13 is UTC-4: a 09:00 window = 13:00 UTC.
    // 2026-07-13T00:00Z is still Sunday evening in New York, so scan two
    // days to reach the NY Monday.
    const slots = computeSlots({
      eventType: { ...ET, timezone: "America/New_York" },
      windows: [NINE_TO_TEN],
      bookings: [],
      from: MONDAY,
      days: 2,
      now: NOW,
    });
    expect(slots.map((s) => s.toISOString())).toContain("2026-07-13T13:00:00.000Z");
  });
});
