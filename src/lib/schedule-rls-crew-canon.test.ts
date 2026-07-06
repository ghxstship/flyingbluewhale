import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Unified-schedule (CP·4) regression guard — the `events` schedule store write
 * surfaces must admit `crew`.
 *
 * The unified operational timeline (/studio/operations/schedule) is writable by
 * the crew persona from /m (claim / reschedule your own activity). Its create +
 * reschedule server actions run on the RLS-enforced USER client and only require
 * a session, so any org member — crew included — is app-authorized. `events` is
 * the canonical schedule store (behind /studio/schedule too); its insert/update
 * bands once read
 *   ['owner','admin','manager','controller','collaborator']
 * — omitting `crew`. `private.has_org_role` matches role::text OR persona, so a
 * real crew member (role=member, persona=crew) PASSED the app check but the DB
 * rejected the write: the exact app-vs-RLS inversion class fixed for time_entries
 * / incidents in the compvss-field crew grant, here for the schedule store in
 * 20260706183539_unified_schedule_events_rls_crew_grant.sql.
 *
 * Pure-text guard (no live DB): resolve the LAST (effective) definition of each
 * guarded write policy and assert `'crew'` is in its has_org_role band. Mirrors
 * src/lib/compvss-field-rls-crew-canon.test.ts. DELETE is intentionally excluded
 * — crew must not hard-delete schedule rows.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

const GUARDED_WRITE_POLICIES: ReadonlyArray<{ table: string; policy: string }> = [
  { table: "events", policy: "events_insert" },
  { table: "events", policy: "events_update" },
];

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

describe("unified schedule RLS crew canon", () => {
  for (const { table, policy } of GUARDED_WRITE_POLICIES) {
    it(`${policy} (on ${table}) grants 'crew' in its has_org_role band`, () => {
      const body = lastPolicyBody(policy, table);
      expect(body, `policy ${policy} on ${table} is not defined in any migration`).not.toBeNull();
      expect(body).toMatch(/has_org_role/i);
      expect(
        /'crew'/.test(body!),
        `policy ${policy} on ${table} omits 'crew' — /studio/operations/schedule + /m app-authorize the crew persona but RLS rejects the write`,
      ).toBe(true);
    });
  }
});
