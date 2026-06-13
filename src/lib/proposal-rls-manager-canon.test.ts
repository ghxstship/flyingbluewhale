import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * D1 regression guard — proposal-lifecycle RLS must admit `manager`.
 *
 * The app guard `isManagerPlus()` (src/lib/auth.ts) admits role `manager`,
 * and the proposal create/convert server actions run on the RLS-enforced
 * user client. If the write policies on `proposals`, `proposal_share_links`,
 * and `projects` omit `manager` from their role band, a real manager
 * (persona NOT in owner/admin/controller/collaborator) passes the app check
 * but the DB rejects the write — the exact HIGH-severity authorization
 * defect found on 2026-06-12 and fixed in
 * `20260612180000_proposal_rls_manager_grant.sql`.
 *
 * This spec parses the migrations, resolves the LAST (effective) definition
 * of each guarded write policy, and asserts `'manager'` is present in its
 * `private.has_org_role(...)` band. It is a pure-text guard (no live DB) so
 * it runs under the standard vitest gate and fails loudly if a future
 * migration drops `manager` back out of the band.
 *
 * Mirrors the introspection style of `src/lib/ldp-naming-canon.test.ts`.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

// (table, policy) pairs whose write band MUST include 'manager'. The first
// six are the hard-blocking surfaces of the proposal create/convert path
// (20260612180000_proposal_rls_manager_grant.sql); the last five are the
// convert-SEED downstream tables that convertProposalToProjectAction writes
// after the project exists (20260613170000_convert_seed_rls_manager_grant.sql)
// — without them a manager gets a project but SILENTLY no deposit/balance
// invoices and no seeded deliverables/budgets, because those seeds soft-fail.
// A missing grant here returns "new row violates row-level security policy"
// to a manager who the app already authorized.
//
// NOT listed (intentionally): deliverables_insert + master_catalog_items_org_rw
// gate on private.is_org_member, which already admits a manager — there is no
// 4-role band to widen, so they carry no manager-specific guard.
const GUARDED_WRITE_POLICIES: ReadonlyArray<{ table: string; policy: string }> = [
  { table: "proposals", policy: "proposals_insert" },
  { table: "proposals", policy: "proposals_update" },
  { table: "projects", policy: "projects_insert" },
  { table: "projects", policy: "projects_update" },
  { table: "proposal_share_links", policy: "proposal_share_links_modify__insert" },
  { table: "proposal_share_links", policy: "proposal_share_links_update_consolidated" },
  // convert-seed downstream (D1 follow-up)
  { table: "invoices", policy: "invoices_insert" },
  { table: "invoices", policy: "invoices_update" },
  { table: "budgets", policy: "budgets_insert" },
  { table: "budgets", policy: "budgets_update" },
  { table: "deliverables", policy: "deliverables_update_consolidated" },
];

/**
 * Return the body of the LAST `create policy "<policy>" on ... <table>`
 * statement across all migrations (sorted by filename = chronological),
 * or null if no migration defines it. The body runs from the `create
 * policy` keyword to the terminating semicolon.
 */
function lastPolicyBody(policy: string, table: string): string | null {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort();

  let body: string | null = null;
  // Match `create policy "<policy>" on "public"."<table>" ...;`
  // (case-insensitive; tolerant of optional quoting and whitespace).
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

describe("proposal-lifecycle RLS manager canon", () => {
  for (const { table, policy } of GUARDED_WRITE_POLICIES) {
    it(`${policy} (on ${table}) grants 'manager' in its has_org_role band`, () => {
      const body = lastPolicyBody(policy, table);
      expect(body, `policy ${policy} on ${table} is not defined in any migration`).not.toBeNull();
      expect(body).toMatch(/has_org_role/i);
      // The band must include 'manager'. Without this, isManagerPlus()-gated
      // create/convert actions 500 at the DB for a real (non-owner-persona)
      // manager. See 20260612180000_proposal_rls_manager_grant.sql.
      expect(
        /'manager'/.test(body!),
        `policy ${policy} on ${table} omits 'manager' — app guard isManagerPlus admits it but RLS rejects the write`,
      ).toBe(true);
    });
  }
});
