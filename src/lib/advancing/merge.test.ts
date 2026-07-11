import { describe, expect, it } from "vitest";
import { advanceSubject, buildMergeContext, renderMergeString } from "./merge";
import { canAdvanceDelivery } from "@/lib/db/advance-packets";
import { SUBMISSION_SCHEMAS, getSubmissionSchema } from "./submission-schemas";

describe("advance merge grammar (kit 27)", () => {
  it("subject follows the campaign convention: ProjectCode Advance | Team · Company", () => {
    expect(advanceSubject({ projectCode: "MochakkCalling_050925", team: "Lasers", company: "LaserNet" })).toBe(
      "MochakkCalling_050925 Advance | Lasers · LaserNet",
    );
  });

  it("subject degrades to company-only when the audience has no team", () => {
    expect(advanceSubject({ projectCode: "X", company: "Cumbiamba" })).toBe("X Advance | Cumbiamba");
  });

  it("emoji prefix appears ONLY when voice is not neutral (decision #3)", () => {
    expect(advanceSubject({ projectCode: "X", company: "Co", voice: "neutral" }).startsWith("X")).toBe(true);
    expect(advanceSubject({ projectCode: "X", company: "Co", voice: "flair" })).toMatch(/^\S+ \| X Advance \| Co$/u);
  });

  it("renderMergeString resolves {{dotted.paths}} and blanks unknown tokens", () => {
    const ctx = buildMergeContext({
      projectName: "MMW26 Hialeah",
      company: "LaserNet",
      team: "Lasers",
      contractId: "CT-4F2A9C1B",
      portalUrl: "https://example.test/p/mmw26/advancing?t=abc",
    });
    expect(renderMergeString("{{project.code}} | {{recipient.contractId}} | {{nope.nope}}", ctx)).toBe(
      "MMW26Hialeah | CT-4F2A9C1B | ",
    );
    expect(ctx["links.portal"]).toContain("?t=abc");
  });
});

describe("delivery funnel (forward-only)", () => {
  it("advances forward and never regresses", () => {
    expect(canAdvanceDelivery("queued", "delivered")).toBe(true);
    expect(canAdvanceDelivery("delivered", "opened")).toBe(true);
    expect(canAdvanceDelivery("opened", "submitted")).toBe(true);
    expect(canAdvanceDelivery("submitted", "opened")).toBe(false);
    expect(canAdvanceDelivery("complete", "submitted")).toBe(false);
  });

  it("bounce is only reachable pre-engagement, and is terminal", () => {
    expect(canAdvanceDelivery("queued", "bounced")).toBe(true);
    expect(canAdvanceDelivery("delivered", "bounced")).toBe(true);
    expect(canAdvanceDelivery("opened", "bounced")).toBe(false);
    expect(canAdvanceDelivery("bounced", "delivered")).toBe(false);
  });
});

describe("submission schemas", () => {
  it("ships the four Phase-1 schemas (travel included, decision #4)", () => {
    expect(Object.keys(SUBMISSION_SCHEMAS).sort()).toEqual(
      ["crew_list", "production_advance", "rider_upload", "travel"].sort(),
    );
  });

  it("travel schema carries the per-person worksheet columns", () => {
    const travel = getSubmissionSchema("travel")!;
    const keys = travel.columns.map((c) => c.key);
    for (const expected of ["name", "arrival_date", "departure_date", "origin", "hotel_nights", "ground_transport", "agency_ref"]) {
      expect(keys).toContain(expected);
    }
  });

  it("unknown keys resolve to null, not a crash", () => {
    expect(getSubmissionSchema("nope")).toBeNull();
    expect(getSubmissionSchema(null)).toBeNull();
  });
});
