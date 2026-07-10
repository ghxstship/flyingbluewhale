import { describe, expect, it } from "vitest";
import {
  canTransitionDaySheet,
  DAY_SHEET_STATES,
  DAY_SHEET_STATE_LABELS,
  DAY_SHEET_STATE_TONE,
  daySheetStateLabel,
  NEXT_DAY_SHEET_STATES,
} from "./day-sheets";

describe("day sheet lifecycle", () => {
  it("covers every state with a label and a tone", () => {
    for (const s of DAY_SHEET_STATES) {
      expect(DAY_SHEET_STATE_LABELS[s]).toBeTruthy();
      expect(DAY_SHEET_STATE_TONE[s]).toBeTruthy();
      expect(NEXT_DAY_SHEET_STATES[s]).toBeDefined();
    }
  });

  it("walks the forward path not_started → draft → published → updated → published", () => {
    expect(canTransitionDaySheet("not_started", "draft")).toBe(true);
    expect(canTransitionDaySheet("draft", "published")).toBe(true);
    expect(canTransitionDaySheet("published", "updated")).toBe(true);
    expect(canTransitionDaySheet("updated", "published")).toBe(true);
  });

  it("rejects illegal jumps (a stale tab can't skip states)", () => {
    expect(canTransitionDaySheet("not_started", "published")).toBe(false);
    expect(canTransitionDaySheet("draft", "updated")).toBe(false);
    expect(canTransitionDaySheet("published", "draft")).toBe(false);
    expect(canTransitionDaySheet("not_started", "not_started")).toBe(false);
  });

  it("labels unknown states as their raw value", () => {
    expect(daySheetStateLabel("published")).toBe("Published");
    expect(daySheetStateLabel("mystery")).toBe("mystery");
  });
});
