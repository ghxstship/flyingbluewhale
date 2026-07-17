import { describe, expect, it } from "vitest";
import { dependentsBlockMessage, isDependentsBlock } from "./separation";

/**
 * The fixture is the VERBATIM message the live trigger raised during
 * verification — not an invented string. If the trigger's wording changes, this
 * test is what notices that the operator-facing copy silently became the raw
 * Postgres error.
 */
const REAL_TRIGGER_ERROR = {
  message:
    "crew_member_has_dependents: __probe HasHistory has history (public.credentials (1)) — separate instead of deleting",
};

describe("isDependentsBlock", () => {
  it("recognises the separation guard refusing a destructive delete", () => {
    expect(isDependentsBlock(REAL_TRIGGER_ERROR)).toBe(true);
  });

  it("does NOT claim an unrelated FK restriction as its own", () => {
    // The trigger raises 23001 (restrict_violation) — and so does a plain FK
    // RESTRICT, which `offer_letters.crew_member_id` genuinely has. Matching on
    // the SQLSTATE alone would mis-label a real FK error as "separate instead",
    // sending the operator to a button that would not help.
    expect(isDependentsBlock({ message: 'insert or update violates foreign key constraint "x_fkey"' })).toBe(false);
  });

  it("is safe on null / empty / non-string errors", () => {
    expect(isDependentsBlock(null)).toBe(false);
    expect(isDependentsBlock(undefined)).toBe(false);
    expect(isDependentsBlock({})).toBe(false);
  });
});

describe("dependentsBlockMessage", () => {
  it("names what is actually blocking, and points at Separate", () => {
    const msg = dependentsBlockMessage(REAL_TRIGGER_ERROR);
    // "Cannot delete" with no reason reads as a bug and invites a workaround.
    expect(msg).toContain("public.credentials (1)");
    expect(msg).toContain("Separate");
    expect(msg).toContain("compliance");
  });

  it("degrades to a useful sentence when the detail is unparseable", () => {
    const msg = dependentsBlockMessage({ message: "crew_member_has_dependents: something odd" });
    expect(msg).toContain("Separate");
    expect(msg).not.toContain("undefined");
  });

  it("never leaks a raw Postgres error at the operator", () => {
    const msg = dependentsBlockMessage(REAL_TRIGGER_ERROR);
    expect(msg).not.toContain("crew_member_has_dependents:");
    expect(msg).not.toContain("ERRCODE");
  });
});
