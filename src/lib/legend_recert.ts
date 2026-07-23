/**
 * LEG3ND certification issuance + recert decision canon (L-P6b, readiness
 * blockers B-3 / B-5).
 *
 * ONE ISSUANCE PATH: `buildCertificationGrant` + `grantCertificationHolder`
 * reproduce, field for field, the upsert the auto-certify flow performs on
 * assessment pass (`src/app/(legend)/legend/learn/actions.ts` — the
 * `certification_holders` upsert with `onConflict:
 * "org_id,certification_id,user_id"` and the `validity_months * 30 days`
 * expiry). The recert approve action issues through THIS module, so a
 * renewal refreshes the SAME artifact row (the unique
 * (org, certification, user) holding) that the assessment path created —
 * same printable certificate URL, same verify RPC record. The learning tree
 * is owned by another workstream, so it still carries its inline copy; the
 * lockstep test in `legend_recert.test.ts` reads that source and fails the
 * moment the two paths drift.
 *
 * Everything except `grantCertificationHolder` is pure (now injected — no
 * Date.now in shared libs) so the lifecycle is unit-testable:
 * request → approve issues exactly one grant; deny issues none;
 * double-decision is blocked.
 */
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { RecertState } from "@/lib/legend_compliance";

/** The upsert conflict target — the artifact identity. Mirrored verbatim by
 *  the auto-certify flow in learn/actions.ts (lockstep-tested). */
export const HOLDER_CONFLICT_TARGET = "org_id,certification_id,user_id";

/** Recert states a manager may still decide. Everything else is terminal —
 *  a second decision on the same request is an illegal jump. */
export const DECIDABLE_RECERT_STATES: readonly RecertState[] = ["requested", "in_review"];

export function canDecideRecert(state: string): boolean {
  return (DECIDABLE_RECERT_STATES as readonly string[]).includes(state);
}

export type RecertDecision = "approved" | "rejected";

/**
 * Expiry date math — identical to the auto-certify flow: a "month" of
 * validity is 30 days. Returns a `date` string (YYYY-MM-DD) or null for a
 * never-expiring credential.
 */
export function computeCertExpiry(validityMonths: number | null | undefined, now: Date): string | null {
  if (!validityMonths) return null;
  return new Date(now.getTime() + validityMonths * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export type CertificationGrant = {
  org_id: string;
  certification_id: string;
  user_id: string;
  source_course_id: string | null;
  issued_at: string;
  expires_on: string | null;
  last_recert_at: string | null;
  next_recert_due: string | null;
  accreditation_state: "valid";
};

/**
 * Build the one canonical `certification_holders` upsert payload. The
 * assessment-pass path and the recert-approve path both resolve to this
 * shape; `recert: true` additionally stamps `last_recert_at` (a first
 * issuance leaves it null, exactly as learn/actions.ts does by omission).
 */
export function buildCertificationGrant(input: {
  orgId: string;
  certificationId: string;
  userId: string;
  sourceCourseId: string | null;
  validityMonths: number | null | undefined;
  now: Date;
  recert?: boolean;
}): CertificationGrant {
  const expires = computeCertExpiry(input.validityMonths, input.now);
  return {
    org_id: input.orgId,
    certification_id: input.certificationId,
    user_id: input.userId,
    source_course_id: input.sourceCourseId,
    issued_at: input.now.toISOString(),
    expires_on: expires,
    last_recert_at: input.recert ? input.now.toISOString() : null,
    next_recert_due: expires,
    accreditation_state: "valid",
  };
}

/** Execute a grant — the single write anchor for certification issuance. */
export async function grantCertificationHolder(
  db: LooseSupabase,
  grant: CertificationGrant,
): Promise<{ error: { message: string } | null }> {
  const { error } = await db
    .from("certification_holders")
    .upsert(grant, { onConflict: HOLDER_CONFLICT_TARGET });
  return { error };
}

export type RecertDecisionPlan =
  | { error: string }
  | {
      /** Patch for the `certification_recerts` row. */
      update: {
        recert_state: RecertState;
        decided_at: string;
        decided_by: string;
        decision_note: string | null;
      };
      /** Present iff the decision issues a renewed artifact (approve only). */
      grant: CertificationGrant | null;
    };

/**
 * Pure decision planner: given the current request state and the credential
 * being renewed, produce the recert-row patch plus (on approve) EXACTLY ONE
 * grant payload. Deny produces zero grants. A request already decided
 * produces an error — the executing action must additionally guard the
 * write with a `.in("recert_state", DECIDABLE_RECERT_STATES)` filter and a
 * read-back so a concurrent double-decision cannot slip between plan and
 * write.
 */
export function planRecertDecision(input: {
  decision: RecertDecision;
  currentState: string;
  deciderId: string;
  note?: string | null;
  holder: { org_id: string; certification_id: string; user_id: string; source_course_id: string | null };
  validityMonths: number | null | undefined;
  now: Date;
}): RecertDecisionPlan {
  if (!canDecideRecert(input.currentState)) {
    return { error: `Request already ${input.currentState}` };
  }
  const update = {
    recert_state: input.decision,
    decided_at: input.now.toISOString(),
    decided_by: input.deciderId,
    decision_note: input.note?.trim() || null,
  };
  if (input.decision !== "approved") return { update, grant: null };
  return {
    update,
    grant: buildCertificationGrant({
      orgId: input.holder.org_id,
      certificationId: input.holder.certification_id,
      userId: input.holder.user_id,
      sourceCourseId: input.holder.source_course_id,
      validityMonths: input.validityMonths,
      now: input.now,
      recert: true,
    }),
  };
}
