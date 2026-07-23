import { describe, it, expect } from "vitest";
import {
  NEXT_ASSESSMENT_STATES,
  NEXT_COURSE_STATES,
  NEXT_LESSON_STATES,
  NEXT_SESSION_STATES,
  canPublishAssessment,
  canPublishCourse,
  canTransition,
  neighborSwap,
  parseOptionLines,
} from "./legend_teach";
import { COURSE_STATES, LESSON_STATES, ASSESSMENT_STATES } from "./legend_learning";
import { SESSION_STATES } from "./legend_live";

/**
 * Authoring-lifecycle unit guard (L-P6a ratchet) — the LDP transition maps
 * and honest publish guards behind the /legend/teach actions. A change
 * that lets a course publish with zero published lessons, an assessment
 * publish with zero questions, or a terminal session state move again is
 * a regression against PERSONA_MATRIX blockers B-1/B-2.
 */

describe("legend teach — course lifecycle", () => {
  it("covers every course state with a transition entry", () => {
    for (const s of COURSE_STATES) expect(NEXT_COURSE_STATES[s]).toBeDefined();
  });

  it("draft publishes and archives; published unpublishes; archived only restores", () => {
    expect(canTransition(NEXT_COURSE_STATES, "draft", "published")).toBe(true);
    expect(canTransition(NEXT_COURSE_STATES, "draft", "archived")).toBe(true);
    expect(canTransition(NEXT_COURSE_STATES, "published", "draft")).toBe(true);
    expect(canTransition(NEXT_COURSE_STATES, "published", "archived")).toBe(true);
    expect(canTransition(NEXT_COURSE_STATES, "archived", "draft")).toBe(true);
    expect(canTransition(NEXT_COURSE_STATES, "archived", "published")).toBe(false);
    // Self-transitions are never legal.
    for (const s of COURSE_STATES) expect(canTransition(NEXT_COURSE_STATES, s, s)).toBe(false);
  });

  it("publish guard: a course needs at least one published lesson", () => {
    expect(canPublishCourse(0)).toBe(false);
    expect(canPublishCourse(1)).toBe(true);
    expect(canPublishCourse(12)).toBe(true);
  });
});

describe("legend teach — lesson + assessment lifecycles", () => {
  it("lesson and assessment maps cover all states and forbid self-transitions", () => {
    for (const s of LESSON_STATES) {
      expect(NEXT_LESSON_STATES[s]).toBeDefined();
      expect(canTransition(NEXT_LESSON_STATES, s, s)).toBe(false);
    }
    for (const s of ASSESSMENT_STATES) {
      expect(NEXT_ASSESSMENT_STATES[s]).toBeDefined();
      expect(canTransition(NEXT_ASSESSMENT_STATES, s, s)).toBe(false);
    }
  });

  it("publish guard: an assessment needs at least one question", () => {
    expect(canPublishAssessment(0)).toBe(false);
    expect(canPublishAssessment(1)).toBe(true);
  });
});

describe("legend teach — live-session lifecycle", () => {
  it("covers every session state; scheduled → live → ended; cancel from scheduled/live only", () => {
    for (const s of SESSION_STATES) expect(NEXT_SESSION_STATES[s]).toBeDefined();
    expect(canTransition(NEXT_SESSION_STATES, "scheduled", "live")).toBe(true);
    expect(canTransition(NEXT_SESSION_STATES, "scheduled", "cancelled")).toBe(true);
    expect(canTransition(NEXT_SESSION_STATES, "live", "ended")).toBe(true);
    expect(canTransition(NEXT_SESSION_STATES, "live", "cancelled")).toBe(true);
    // Forward-only: no skipping scheduled → ended, no reviving terminals.
    expect(canTransition(NEXT_SESSION_STATES, "scheduled", "ended")).toBe(false);
    expect(NEXT_SESSION_STATES.ended).toEqual([]);
    expect(NEXT_SESSION_STATES.cancelled).toEqual([]);
  });
});

describe("legend teach — neighborSwap (up/down reorder)", () => {
  const items = [
    { id: "a", sort_order: 0 },
    { id: "b", sort_order: 1 },
    { id: "c", sort_order: 2 },
  ];

  it("swaps with the previous/next neighbor", () => {
    expect(neighborSwap(items, "b", "up")).toEqual([
      { id: "b", sort_order: 0 },
      { id: "a", sort_order: 1 },
    ]);
    expect(neighborSwap(items, "b", "down")).toEqual([
      { id: "b", sort_order: 2 },
      { id: "c", sort_order: 1 },
    ]);
  });

  it("edge moves and unknown ids are no-ops (null)", () => {
    expect(neighborSwap(items, "a", "up")).toBeNull();
    expect(neighborSwap(items, "c", "down")).toBeNull();
    expect(neighborSwap(items, "zz", "up")).toBeNull();
    expect(neighborSwap([], "a", "up")).toBeNull();
  });

  it("normalizes tied sort_order values (legacy all-zero seeds) by index", () => {
    const tied = [
      { id: "a", sort_order: 0 },
      { id: "b", sort_order: 0 },
      { id: "c", sort_order: 0 },
    ];
    // Moving c up must still produce a distinguishable order.
    expect(neighborSwap(tied, "c", "up")).toEqual([
      { id: "c", sort_order: 1 },
      { id: "b", sort_order: 2 },
    ]);
  });
});

describe("legend teach — parseOptionLines", () => {
  it("splits per line, trims, and drops blanks", () => {
    expect(parseOptionLines("One\n  Two  \n\r\n\nThree\n")).toEqual(["One", "Two", "Three"]);
    expect(parseOptionLines("")).toEqual([]);
    expect(parseOptionLines("   \n \n")).toEqual([]);
  });
});
