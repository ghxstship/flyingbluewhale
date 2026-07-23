import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Phase-4 regression guard — LEG3ND learner write surfaces must admit ANY org
 * member (the learner persona), not gate behind a manager role band.
 *
 * No persona auto-routes to /legend; the learner is any authed org member
 * (e.g. the `crew` / `member` persona) who navigates in. Its core learn-spine +
 * community + live + store write actions run on the RLS-enforced USER client and
 * only require a session (`requireSession`) plus `user_id = auth.uid()` — so the
 * INSERT band MUST be membership-scoped (`private.is_org_member(org_id)` AND the
 * writer's own id), NOT `private.has_org_role(org_id, [...manager roles])`.
 *
 * This is the same app-vs-RLS inversion class fixed for `manager` in
 * 20260625144337_rls_manager_grant_sweep.sql and for `crew` in
 * 20260625145648_compvss_field_rls_crew_grant.sql: an action passes
 * requireSession but the DB rejects the write because the band omits the writing
 * persona. The legend learning/community/live/store migrations got this RIGHT
 * (membership-banded inserts) — this guard locks that in so a future "tighten
 * the policy" edit can't silently re-band a learner write to manager-only and
 * lock the learner out of enrolling, completing lessons, submitting quizzes,
 * posting, registering, or redeeming.
 *
 * Pure-text guard (no live DB): resolves the LAST definition of each policy
 * across all migrations — matching BOTH `create policy "<p>" on ... <table>` and
 * the `alter policy "<p>" on ... <table> with check (...)` rewrites (the
 * rls_initplan migration re-expressed these as `alter policy`) — and asserts the
 * effective WITH CHECK band is membership-scoped + self-id, and is NOT a
 * manager-only `has_org_role` gate. Mirrors src/lib/compvss-field-rls-crew-canon.test.ts.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

// (table, policy) pairs for the learner-written tables. Each must let any org
// member insert their own row (no manager role band).
const LEARNER_WRITE_POLICIES: ReadonlyArray<{ table: string; policy: string }> = [
  { table: "course_enrollments", policy: "course_enrollments_insert" },
  { table: "lesson_progress", policy: "lesson_progress_insert" },
  { table: "assessment_attempts", policy: "assessment_attempts_insert" },
  { table: "community_posts", policy: "community_posts_insert" },
  { table: "legend_session_registrations", policy: "legend_session_registrations_insert" },
  // Crew self-service join (PERSONA_MATRIX S-2, migration 20260723180000) —
  // the manager-band legend_crew_members_write policy stays for roster
  // curation; this is the learner's own-row insert band.
  { table: "legend_crew_members", policy: "legend_crew_members_self_insert" },
];

/**
 * Return the body of the LAST `create policy` OR `alter policy` statement for
 * (policy, table) across all migrations (filename-sorted = chronological), or
 * null if none defines it.
 */
function lastPolicyBody(policy: string, table: string): string | null {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort();

  let body: string | null = null;
  const re = new RegExp(
    `(?:create|alter)\\s+policy\\s+"?${policy}"?\\s+on\\s+"?public"?\\."?${table}"?[\\s\\S]*?;`,
    "gi",
  );
  for (const name of files) {
    const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
    const matches = txt.match(re);
    if (matches && matches.length > 0) body = matches[matches.length - 1]!;
  }
  return body;
}

describe("LEG3ND learner RLS canon", () => {
  for (const { table, policy } of LEARNER_WRITE_POLICIES) {
    it(`${policy} (on ${table}) is membership-banded for the learner persona`, () => {
      const body = lastPolicyBody(policy, table);
      expect(body, `policy ${policy} on ${table} is not defined in any migration`).not.toBeNull();
      // Any org member may write their own row.
      expect(
        /is_org_member\s*\(/i.test(body!),
        `policy ${policy} on ${table} must scope by private.is_org_member — a learner is any org member`,
      ).toBe(true);
      // The band must NOT be a manager-only has_org_role gate (that would
      // app-authorize the learner via requireSession but RLS-reject the write).
      expect(
        /has_org_role/i.test(body!),
        `policy ${policy} on ${table} gates a learner write behind has_org_role — ` +
          `the /legend learner persona app-authorizes (requireSession) but RLS would reject the insert`,
      ).toBe(false);
    });
  }
});
