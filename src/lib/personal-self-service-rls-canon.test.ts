import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * D1 regression guard — /me self-managed marketplace profile write surfaces
 * must admit the OWNING user (self-write), not only the org-role roster band.
 *
 * The personal (/me) shell is each user's OWN self-service workspace. Two of its
 * marketplace surfaces let any authed org member upsert a profile row keyed to
 * their own user_id (the actions only `requireSession()`):
 *
 *   · /me/crew    → crew_members  upsert (upsertMyCrewAction)
 *   · /me/talent  → talent_profiles upsert (upsertMyTalentAction)
 *
 * `crew_members`'s write band once read purely
 *   has_org_role(org_id, ['owner','admin','manager','controller','collaborator'])
 * — omitting the self-write clause. private.has_org_role matches role::text OR
 * persona, so a plain `member`/`community` persona (role=member, persona=member)
 * PASSED the app check but the DB rejected the write with "new row violates
 * row-level security policy": the self-managed crew editor literally could not
 * save for the very personas it serves. The exact app-vs-RLS inversion class
 * fixed for `crew` on /m in 20260625145648_compvss_field_rls_crew_grant.sql,
 * here for the self-service profile owner in
 * 20260625164140_crew_members_rls_self_write_grant.sql.
 *
 * Masked in the demo/seed org because seeded memberships carry persona='owner'.
 *
 * This spec parses the migrations, resolves the LAST (effective) definition of
 * each guarded write policy, and asserts the self-write clause
 * `user_id = ... auth.uid()` is present. Pure-text guard (no live DB) — fails
 * loudly if a future migration drops the self-write clause back out.
 * Mirrors src/lib/compvss-field-rls-crew-canon.test.ts.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

// (table, policy) pairs whose write band MUST admit the owning user — the /me
// self-managed profile surfaces.
const GUARDED_WRITE_POLICIES: ReadonlyArray<{ table: string; policy: string }> = [
  { table: "crew_members", policy: "crew_members_insert" },
  { table: "crew_members", policy: "crew_members_update" },
  { table: "talent_profiles", policy: "talent_profiles_update" },
];

/**
 * Return the body of the LAST `create policy "<policy>" on ... <table>`
 * statement across all migrations (sorted by filename = chronological).
 */
function lastPolicyBody(policy: string, table: string): string | null {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort();

  let body: string | null = null;
  const re = new RegExp(
    `create\\s+policy\\s+"?${policy}"?\\s+on\\s+"?public"?\\."?${table}"?[\\s\\S]*?;`,
    "gi",
  );
  for (const name of files) {
    const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
    const matches = txt.match(re);
    if (matches && matches.length > 0) {
      body = matches[matches.length - 1]!;
    }
  }
  return body;
}

describe("personal /me self-service RLS canon", () => {
  for (const { table, policy } of GUARDED_WRITE_POLICIES) {
    it(`${policy} (on ${table}) admits the owning user (self-write clause)`, () => {
      const body = lastPolicyBody(policy, table);
      expect(body, `policy ${policy} on ${table} is not defined in any migration`).not.toBeNull();
      // Quote-tolerant: pg_dump emits quoted/schema-qualified identifiers
      // ("user_id" = ( SELECT "auth"."uid"() ...)), hand-authored migrations use
      // bare ones (user_id = (select auth.uid())). Match the self-write clause
      // either way: a user_id comparison anchored to auth.uid().
      const selfWrite = /"?user_id"?\s*=\s*\(?\s*(?:select\s+)?(?:"?auth"?\.)?"?uid"?\s*\(\)|"?user_id"?\s*=\s*\(?\s*(?:select\s+)?"?auth"?\.?"?uid"?/i;
      expect(
        selfWrite.test(body!),
        `policy ${policy} on ${table} omits the self-write clause (user_id = auth.uid()) — ` +
          `/me surfaces app-authorize the profile owner but RLS rejects the write`,
      ).toBe(true);
    });
  }
});
