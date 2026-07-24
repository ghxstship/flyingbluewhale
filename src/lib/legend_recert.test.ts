import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DECIDABLE_RECERT_STATES,
  HOLDER_CONFLICT_TARGET,
  buildCertificationGrant,
  canDecideRecert,
  computeCertExpiry,
  planRecertDecision,
} from "./legend_recert";

/**
 * L-P6b ratchets — certification lifecycle closure (readiness blockers
 * B-3 / B-5).
 *
 * 1. LIFECYCLE: request → approve issues EXACTLY ONE artifact grant; deny
 *    issues none; a second decision on a decided request is blocked.
 * 2. ONE ISSUANCE PATH: the recert-approve grant is field-identical to the
 *    assessment auto-certify upsert. The learning tree is owned by another
 *    workstream, so it keeps its inline copy — the lockstep assertions below
 *    read that source and fail the moment the two paths drift.
 * 3. SURFACE GUARD: `certification_recerts` was insert-only (the request was
 *    a dead letter). These greps pin the read/decide surface in place so it
 *    cannot regress to write-only.
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const NOW = new Date("2026-07-23T12:00:00.000Z");
const HOLDER = {
  org_id: "org-1",
  certification_id: "cert-1",
  user_id: "user-1",
  source_course_id: "course-1",
};

describe("recert decision lifecycle", () => {
  it("approve on a requested recert issues exactly one grant", () => {
    const plan = planRecertDecision({
      decision: "approved",
      currentState: "requested",
      deciderId: "mgr-1",
      holder: HOLDER,
      validityMonths: 12,
      now: NOW,
    });
    if ("error" in plan) throw new Error(`unexpected error: ${plan.error}`);
    expect(plan.update.recert_state).toBe("approved");
    expect(plan.update.decided_by).toBe("mgr-1");
    expect(plan.update.decided_at).toBe(NOW.toISOString());
    // Exactly one artifact: one grant payload, targeting the unique
    // (org, certification, user) holding — the upsert conflict target means
    // a renewal refreshes the existing artifact row, never mints a second.
    expect(plan.grant).not.toBeNull();
    expect(plan.grant?.org_id).toBe("org-1");
    expect(plan.grant?.certification_id).toBe("cert-1");
    expect(plan.grant?.user_id).toBe("user-1");
    expect(plan.grant?.accreditation_state).toBe("valid");
    expect(plan.grant?.last_recert_at).toBe(NOW.toISOString());
    expect(plan.grant?.expires_on).toBe(computeCertExpiry(12, NOW));
    expect(plan.grant?.next_recert_due).toBe(plan.grant?.expires_on);
  });

  it("approve while in_review is also decidable", () => {
    const plan = planRecertDecision({
      decision: "approved",
      currentState: "in_review",
      deciderId: "mgr-1",
      holder: HOLDER,
      validityMonths: null,
      now: NOW,
    });
    if ("error" in plan) throw new Error(`unexpected error: ${plan.error}`);
    // Never-expiring credential: renewed with no expiry.
    expect(plan.grant?.expires_on).toBeNull();
    expect(plan.grant?.next_recert_due).toBeNull();
  });

  it("deny issues no grant", () => {
    const plan = planRecertDecision({
      decision: "rejected",
      currentState: "requested",
      deciderId: "mgr-1",
      note: "Evidence missing",
      holder: HOLDER,
      validityMonths: 12,
      now: NOW,
    });
    if ("error" in plan) throw new Error(`unexpected error: ${plan.error}`);
    expect(plan.update.recert_state).toBe("rejected");
    expect(plan.update.decision_note).toBe("Evidence missing");
    expect(plan.grant).toBeNull();
  });

  it.each(["approved", "rejected", "completed"] as const)(
    "double-decision is blocked: %s is terminal",
    (state) => {
      const plan = planRecertDecision({
        decision: "approved",
        currentState: state,
        deciderId: "mgr-1",
        holder: HOLDER,
        validityMonths: 12,
        now: NOW,
      });
      expect("error" in plan).toBe(true);
      expect(canDecideRecert(state)).toBe(false);
    },
  );

  it("only requested and in_review are decidable", () => {
    expect([...DECIDABLE_RECERT_STATES].sort()).toEqual(["in_review", "requested"]);
  });
});

describe("one issuance path: recert grant matches the assessment auto-certify upsert", () => {
  const learnActions = read("src/app/(legend)/legend/(public)/learn/actions.ts");

  it("learn/actions.ts still upserts on the same conflict target", () => {
    expect(learnActions).toContain(`onConflict: "${HOLDER_CONFLICT_TARGET}"`);
  });

  it("learn/actions.ts still uses the 30-day-month expiry formula computeCertExpiry mirrors", () => {
    expect(learnActions).toMatch(/months \* 30 \* 24 \* 60 \* 60 \* 1000/);
    // And the mirror agrees: 12 "months" = 360 days.
    expect(computeCertExpiry(12, NOW)).toBe(
      new Date(NOW.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    );
  });

  it("learn/actions.ts still issues the same field set the grant builder produces", () => {
    const grant = buildCertificationGrant({
      orgId: "o",
      certificationId: "c",
      userId: "u",
      sourceCourseId: "s",
      validityMonths: 6,
      now: NOW,
    });
    for (const field of [
      "org_id",
      "certification_id",
      "user_id",
      "source_course_id",
      "issued_at",
      "expires_on",
      "next_recert_due",
      "accreditation_state",
    ]) {
      expect(grant).toHaveProperty(field);
      expect(learnActions).toContain(`${field}:`);
    }
    expect(learnActions).toContain(`accreditation_state: "valid"`);
    expect(grant.accreditation_state).toBe("valid");
    // First issuance leaves last_recert_at null — learn/actions omits it.
    expect(grant.last_recert_at).toBeNull();
  });
});

describe("certification_recerts has a read/decide surface (B-3 closure guard)", () => {
  it("the manager queue page reads the recert table", () => {
    const page = read("src/app/(legend)/legend/(org)/compliance/recerts/page.tsx");
    expect(page).toContain('.from("certification_recerts")');
    expect(page).toContain("isManagerPlus");
    expect(page).toContain("DecideRecertButtons");
  });

  it("the decide action updates recert_state with a double-decision write guard and issues via the canonical path", () => {
    const actions = read("src/app/(legend)/legend/(org)/compliance/recerts/actions.ts");
    expect(actions).toContain('.from("certification_recerts")');
    expect(actions).toContain(".update(");
    expect(actions).toContain(".in(\"recert_state\"");
    expect(actions).toContain("grantCertificationHolder");
    expect(actions).toContain("planRecertDecision");
    // Requester notification on decision, kind-tagged for the opt-out matrix.
    expect(actions).toContain("sendPushTo");
    expect(actions).toContain('kind: "certification"');
  });

  it("the requester's wallet renders the request state honestly", () => {
    const wallet = read("src/app/(legend)/legend/(org)/certifications/page.tsx");
    expect(wallet).toContain('.from("certification_recerts")');
    expect(wallet).toContain("RECERT_STATE_LABELS");
  });

  it("the request intake (learner insert) still exists", () => {
    const intake = read("src/app/(legend)/legend/(org)/certifications/actions.ts");
    expect(intake).toContain('.from("certification_recerts").insert');
  });
});

describe("legend_certifications has a definitions surface (B-5 closure guard)", () => {
  it("manager+ CRUD actions write the certification catalog", () => {
    const actions = read("src/app/(legend)/legend/(org)/certifications/definitions/actions.ts");
    expect(actions).toContain('.from("legend_certifications")');
    expect(actions).toContain(".insert(");
    expect(actions).toContain(".update(");
    expect(actions).toContain("isManagerPlus");
    // Retire is the soft facet — never a hard delete (artifacts reference).
    expect(actions).toContain("certification_state");
    expect(actions).not.toContain(".delete(");
  });

  it("the definitions surface is page-gated and navigable", () => {
    const page = read("src/app/(legend)/legend/(org)/certifications/definitions/page.tsx");
    expect(page).toContain("isManagerPlus");
    expect(page).toContain("AccessDenied");
    const nav = read("src/lib/nav.ts");
    expect(nav).toContain("/legend/certifications/definitions");
    expect(nav).toContain("/legend/compliance/recerts");
  });
});
