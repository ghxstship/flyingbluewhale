import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * D1 regression guard — COMPVSS field write surfaces must admit `crew`.
 *
 * The /m (COMPVSS field PWA) mobile shell is where resolveShell lands the
 * `crew` persona (deskless field workforce). Its core daily-write surfaces run
 * server actions on the RLS-enforced USER client and only require a session
 * (`requireSession`), so any org member — crew included — is app-authorized:
 *
 *   · /m/clock     → time_entries INSERT (clock in) + UPDATE (clock out)
 *   · /m/incident  → incidents UPDATE (My Incidents lifecycle)
 *
 * The write bands on these tables once read
 *   ['owner','admin','manager','controller','collaborator']
 * — omitting `crew`. private.has_org_role matches role::text OR persona, so a
 * real crew member (role=member, persona=crew) PASSED the app check but the DB
 * rejected the write with "new row violates row-level security policy": a crew
 * member literally could not punch the clock. The exact app-vs-RLS inversion
 * class fixed for `manager` in 20260625144337_rls_manager_grant_sweep.sql,
 * here for `crew` in 20260625*_compvss_field_rls_crew_grant.sql.
 *
 * Masked in the demo org because seeded memberships carry persona='owner'.
 *
 * This spec parses the migrations, resolves the LAST (effective) definition of
 * each guarded write policy, and asserts `'crew'` is present in its
 * `has_org_role(...)` band. Pure-text guard (no live DB) — runs under the
 * standard vitest gate and fails loudly if a future migration drops `crew`
 * back out of the band. Mirrors src/lib/proposal-rls-manager-canon.test.ts.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

// (table, policy) pairs whose write band MUST include 'crew' — the COMPVSS
// field surfaces the crew persona writes from /m every shift.
const GUARDED_WRITE_POLICIES: ReadonlyArray<{ table: string; policy: string }> = [
  { table: "time_entries", policy: "time_entries_insert" },
  { table: "time_entries", policy: "time_entries_update" },
  { table: "incidents", policy: "incidents_update" },
];

/**
 * Return the body of the LAST `create policy "<policy>" on ... <table>`
 * statement across all migrations (sorted by filename = chronological),
 * or null if no migration defines it.
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

describe("COMPVSS field RLS crew canon", () => {
  for (const { table, policy } of GUARDED_WRITE_POLICIES) {
    it(`${policy} (on ${table}) grants 'crew' in its has_org_role band`, () => {
      const body = lastPolicyBody(policy, table);
      expect(body, `policy ${policy} on ${table} is not defined in any migration`).not.toBeNull();
      expect(body).toMatch(/has_org_role/i);
      expect(
        /'crew'/.test(body!),
        `policy ${policy} on ${table} omits 'crew' — /m surfaces app-authorize the crew persona but RLS rejects the write`,
      ).toBe(true);
    });
  }
});
