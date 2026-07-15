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
 * each guarded write policy, and asserts the crew persona can still make that
 * write. Pure-text guard (no live DB) — runs under the standard vitest gate.
 * Mirrors src/lib/proposal-rls-manager-canon.test.ts.
 *
 * ## Why `admits` exists (ADR-0008 Amendment 7)
 *
 * This guard originally asserted one mechanism: `'crew'` appears in the
 * `has_org_role(...)` band. That is not the requirement — it was one way of
 * meeting it, and on `time_entries` it was the wrong way. `has_org_role` takes
 * no row into account, so `'crew'` in the band admitted a crew member to write
 * **anyone's** payroll row: Amendment 7 confirmed a `member`/`crew` login
 * setting `rate_cents` on another user's entry and forging an 8-hour entry
 * attributed to a third party. The band was doing two jobs — "crew may punch"
 * and "crew may rewrite your pay" — and only the first was intended.
 *
 * `20260715230000_identity_boundary_sweep.sql` splits them: crew are admitted by
 * a self-pin (`is_org_member AND user_id = auth.uid()`) instead, which grants
 * exactly the D1 requirement and nothing else. So the assertion below is now the
 * requirement itself — *the crew persona can write the row it owns* — and
 * `admits` records which shape each table uses:
 *
 *   · `"self"` — the row belongs to the caller (time_entries: clock in/out).
 *     Verified live post-migration: crew clock-in, clock-out, and read-back all
 *     still work; writing ANOTHER user's row is refused.
 *   · `"band"` — no ownership column to key on, so the persona band is the only
 *     available boundary (incidents: crew update incidents in the org queue).
 *
 * A future migration that drops crew's access by EITHER route still fails here.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

// Write policies that MUST keep admitting the crew persona — the COMPVSS field
// surfaces crew write from /m every shift — and by which shape. See the
// `admits` note in the docblock above.
const GUARDED_WRITE_POLICIES: ReadonlyArray<{
  table: string;
  policy: string;
  admits: "band" | "self";
}> = [
  { table: "time_entries", policy: "time_entries_insert", admits: "self" },
  { table: "time_entries", policy: "time_entries_update", admits: "self" },
  { table: "incidents", policy: "incidents_update", admits: "band" },
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
  const re = new RegExp(`create\\s+policy\\s+"?${policy}"?\\s+on\\s+"?public"?\\."?${table}"?[\\s\\S]*?;`, "gi");
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
  for (const { table, policy, admits } of GUARDED_WRITE_POLICIES) {
    const how = admits === "self" ? "via the self-pin (its own row)" : "in its has_org_role band";
    it(`${policy} (on ${table}) still admits the crew persona ${how}`, () => {
      const body = lastPolicyBody(policy, table);
      expect(body, `policy ${policy} on ${table} is not defined in any migration`).not.toBeNull();
      expect(body).toMatch(/has_org_role/i);

      if (admits === "band") {
        expect(
          /'crew'/.test(body!),
          `policy ${policy} on ${table} omits 'crew' — /m surfaces app-authorize the crew persona but RLS rejects the write`,
        ).toBe(true);
        return;
      }

      // admits === "self": crew reach this table by owning the row, NOT by the
      // band. Both halves matter. Without the self-pin, crew cannot punch at all
      // (the D1 regression this file exists for). With 'crew' in the band, the
      // pin is pointless — the band admits every row regardless of owner, which
      // is what let a member rewrite another user's pay (Amendment 7).
      expect(
        /user_id\s*=\s*\(?\s*(?:select\s+)?auth\.uid\(\)/i.test(body!),
        `policy ${policy} on ${table} lost its \`user_id = auth.uid()\` self-pin — that pin is how the ` +
          `crew persona is admitted here, so /m/clock app-authorizes the punch and RLS rejects it (D1).`,
      ).toBe(true);
      expect(
        /'crew'/.test(body!),
        `policy ${policy} on ${table} readmitted 'crew' to its has_org_role band. The band ignores row ` +
          `ownership, so it grants crew write access to EVERY user's payroll row — confirmed live in ` +
          `Amendment 7. Crew are admitted by the self-pin; keep the band to staff.`,
      ).toBe(false);
    });
  }
});
