import { describe, expect, it } from "vitest";
import { fmtPosition } from "./fmt-position";

describe("fmtPosition (kit 31 canon)", () => {
  it("formats snake_case enums to Title Case", () => {
    expect(fmtPosition("stage_manager")).toBe("Stage Manager");
    expect(fmtPosition("gate_and_access_lead")).toBe("Gate And Access Lead");
    expect(fmtPosition("rigger")).toBe("Rigger");
  });

  it("passes already-formatted strings through", () => {
    expect(fmtPosition("Stage Manager")).toBe("Stage Manager");
    expect(fmtPosition("AV Tech")).toBe("AV Tech");
    expect(fmtPosition("OSHA-30")).toBe("OSHA-30");
  });

  it("is safe on null/undefined/empty", () => {
    expect(fmtPosition(null)).toBe("");
    expect(fmtPosition(undefined)).toBe("");
    expect(fmtPosition("")).toBe("");
  });
});
