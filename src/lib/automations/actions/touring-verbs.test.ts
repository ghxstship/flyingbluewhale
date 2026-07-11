/**
 * Kit 26 Phase E — the three touring agent verbs register with the automation
 * action registry (the console's Step Builder inventory) and carry strict
 * input schemas. Registration is side-effectful via the actions barrel, so
 * this also guards that the barrel imports don't get dropped.
 */
import { describe, expect, it } from "vitest";
import { actionRegistry } from "../registry";
import "./index";

const VERBS = ["daysheet.draft_from_advance", "credential.batch_issue", "settlement.settle"] as const;

describe("touring agent verbs (kit 26 Phase E)", () => {
  it("all three verbs are registered with label + description", () => {
    for (const type of VERBS) {
      const verb = actionRegistry[type];
      expect(verb, type).toBeDefined();
      expect(verb!.label.length, `${type} label`).toBeGreaterThan(0);
      expect(verb!.description.length, `${type} description`).toBeGreaterThan(0);
    }
  });

  it("schemas reject malformed input (uuids required)", () => {
    expect(actionRegistry["daysheet.draft_from_advance"]!.schema.safeParse({ projectId: "nope" }).success).toBe(false);
    expect(actionRegistry["credential.batch_issue"]!.schema.safeParse({}).success).toBe(false);
    expect(actionRegistry["settlement.settle"]!.schema.safeParse({ settlementId: 42 }).success).toBe(false);
  });

  it("schemas accept well-formed input", () => {
    const uuid = "aaaaaaaa-0001-4001-8001-000000000001";
    expect(actionRegistry["daysheet.draft_from_advance"]!.schema.safeParse({ projectId: uuid }).success).toBe(true);
    expect(
      actionRegistry["credential.batch_issue"]!.schema.safeParse({ projectId: uuid, assignmentIds: [uuid] }).success,
    ).toBe(true);
    expect(actionRegistry["settlement.settle"]!.schema.safeParse({ settlementId: uuid }).success).toBe(true);
  });
});
