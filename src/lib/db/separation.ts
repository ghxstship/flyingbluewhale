/**
 * Separation vs deletion — the removal contract for people.
 *
 * THE RULE
 * ────────
 * A person with any history is ARCHIVED, never erased: `engagement_state`
 * flips to 'separated' and `separated_at` / `separation_reason` stamp when and
 * why. The row and everything hanging off it — credentials, certifications,
 * ratings, MSAs, assignments, offer letters, safety briefings, shifts — survive
 * for record-keeping and legal retention, and re-engagement is a state flip
 * rather than a re-create.
 *
 * Hard deletion is reserved for a record that never engaged: a typo, a
 * duplicate, an entry created and immediately regretted. Nothing is lost
 * because there is nothing to lose.
 *
 * This holds regardless of whether the person is currently on an active org or
 * project. "Not working here now" is not a reason to destroy the record that
 * they ever did.
 *
 * WHERE IT IS ENFORCED
 * ────────────────────
 * In the DATABASE — a BEFORE DELETE trigger on `crew_members`
 * (`tg_crew_members_block_delete_with_dependents`, migration
 * `crew_members_block_delete_with_dependents`). The cascade is a database
 * behaviour, so the guard has to be one too: an `if` in a server action only
 * protects the path that remembers it, while the trigger covers every path —
 * this action, the workforce surfaces once they are repointed at `crew_members`
 * (ADR-0015 Addendum 2), a future bulk tool, and a hand-typed DELETE.
 *
 * This module is only the TRANSLATION layer: it turns that trigger's error into
 * something an operator can act on. It is deliberately not a second guard —
 * duplicating the rule in TypeScript is how the two drift apart.
 */

/**
 * The trigger's message prefix. Matched rather than the SQLSTATE alone because
 * 23001 (restrict_violation) is also what a plain FK RESTRICT raises — and
 * `offer_letters.crew_member_id` genuinely does RESTRICT, so the code by itself
 * cannot tell "we refused this on purpose" from "a FK happened to block it".
 */
const DEPENDENTS_TOKEN = "crew_member_has_dependents:";

/** True when this error is the separation guard refusing a destructive delete. */
export function isDependentsBlock(err: { message?: string } | null | undefined): boolean {
  return typeof err?.message === "string" && err.message.includes(DEPENDENTS_TOKEN);
}

/**
 * Operator-facing copy for a refused delete.
 *
 * Names what is actually blocking, because "cannot delete" without a reason
 * reads as a bug and invites someone to go around it. Telling them it is
 * credentials and certifications makes the Separate button the obvious move
 * rather than an obstacle.
 */
export function dependentsBlockMessage(err: { message?: string } | null | undefined): string {
  const raw = err?.message ?? "";
  const detail = raw.includes(DEPENDENTS_TOKEN) ? raw.split(DEPENDENTS_TOKEN)[1]?.trim() : "";
  const what = detail && detail.includes("has history (") ? detail.slice(detail.indexOf("(") + 1, detail.lastIndexOf(")")) : "";
  return what
    ? `This person has history on record (${what}). Separate them instead — it archives the record and keeps that history for compliance.`
    : "This person has history on record. Separate them instead — it archives the record and keeps that history for compliance.";
}
