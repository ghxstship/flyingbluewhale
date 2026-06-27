import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Beta multi-tenant SECURITY guard — locks in the fixes from the 2026-06-25
 * Supabase security-advisor remediation pass. RLS is the tenant-isolation
 * boundary for this app, so these are regression guards against the specific
 * cross-tenant holes that were closed:
 *
 *   1. Internal "resolved"/rollup views were SECURITY DEFINER + granted SELECT
 *      to anon — a logged-out visitor could read EVERY org's offer letters
 *      (signatures, PII, IPs), MSAs, consolidated AR/financials, and XPMS cost
 *      rollups. Fixed by switching them to security_invoker=on (respect the
 *      caller's RLS) and revoking anon SELECT.
 *      → 20260625172537_sec_definer_internal_views_to_invoker.sql
 *
 *   2. compute_risk_scores_for_org / generate_wip_snapshot_for_project were
 *      SECURITY DEFINER, took an arbitrary org/project id, wrote to that
 *      tenant, and were EXECUTE-able by anon/PUBLIC → cross-tenant write.
 *      Fixed by revoking anon EXECUTE + adding a private.is_org_member() guard.
 *      → 20260625172650_harden_secdef_functions_and_grants.sql
 *
 *   3. proposal_views INSERT policy was WITH CHECK (true) — any authed user
 *      could forge proposal-open rows into any org. Fixed to a self+org check.
 *      branding bucket had a broad public list policy (key enumeration) — dropped.
 *      → 20260625172757_tighten_proposal_views_and_branding_bucket.sql
 *
 * Pure-text guard (no live DB) — parses the migration corpus and asserts the
 * load-bearing clauses are present and not silently reverted by a later
 * migration. Mirrors src/lib/compvss-field-rls-crew-canon.test.ts.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

function allMigrationsText(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort()
    .map((n) => readFileSync(join(MIGRATIONS_DIR, n), "utf8"))
    .join("\n");
}

// Internal views that must NEVER be anon-readable cross-tenant. Each must be
// switched to security_invoker=on so it respects the querying user's RLS.
const INTERNAL_INVOKER_VIEWS = [
  "offer_letters_resolved",
  "independent_contractor_msas_resolved",
  "v_consolidated_ar",
  "v_xpms_atom_rollup",
  "v_xpms_atom_rollup_recursive",
  "v_siteplan_sheet_acceptance",
  "v_package_band_check",
  "v_line_permit_flags",
] as const;

// SECURITY DEFINER RPCs that write to an arbitrary tenant — must revoke anon
// EXECUTE and carry an org-membership guard.
const CROSS_TENANT_RPCS = [
  "compute_risk_scores_for_org",
  "generate_wip_snapshot_for_project",
] as const;

describe("multi-tenant security advisor canon (beta blockers)", () => {
  const sql = allMigrationsText();
  const normalized = sql.toLowerCase();

  describe("internal resolved/rollup views are invoker-mode + not anon-readable", () => {
    for (const view of INTERNAL_INVOKER_VIEWS) {
      it(`${view} → security_invoker=on`, () => {
        const re = new RegExp(
          `alter\\s+view\\s+(public\\.)?${view}\\s+set\\s*\\(\\s*security_invoker\\s*=\\s*on\\s*\\)`,
          "i",
        );
        expect(re.test(sql), `${view} must be ALTER VIEW ... SET (security_invoker = on)`).toBe(true);
      });

      it(`${view} → anon SELECT revoked`, () => {
        const re = new RegExp(`revoke\\s+select\\s+on\\s+(public\\.)?${view}\\s+from\\s+anon`, "i");
        expect(re.test(sql), `${view} must REVOKE SELECT ... FROM anon`).toBe(true);
      });
    }
  });

  describe("cross-tenant SECURITY DEFINER RPCs are locked down", () => {
    for (const fn of CROSS_TENANT_RPCS) {
      it(`${fn} → anon EXECUTE revoked`, () => {
        const re = new RegExp(`revoke\\s+execute\\s+on\\s+function\\s+(public\\.)?${fn}\\s*\\([^)]*\\)\\s+from\\s+[^;]*\\banon\\b`, "i");
        expect(re.test(sql), `${fn} must REVOKE EXECUTE ... FROM ... anon`).toBe(true);
      });

      it(`${fn} → carries an is_org_member tenant guard`, () => {
        // The latest CREATE OR REPLACE definition's body must reference the
        // canonical org-membership helper (anchor on CREATE so we don't match
        // the trailing REVOKE/GRANT lines, and read to the function terminator).
        const defIdx = normalized.lastIndexOf(`create or replace function public.${fn}(`);
        expect(defIdx, `${fn} must have a CREATE OR REPLACE FUNCTION body`).toBeGreaterThan(-1);
        const endIdx = normalized.indexOf("$function$;", defIdx);
        const body = normalized.slice(defIdx, endIdx > -1 ? endIdx : defIdx + 8000);
        expect(body.includes("private.is_org_member"), `${fn} body must guard with private.is_org_member`).toBe(true);
      });
    }
  });

  describe("proposal_views INSERT is no longer always-true", () => {
    it("the always-true authenticated INSERT policy is dropped", () => {
      expect(
        /drop\s+policy\s+if\s+exists\s+"?proposal_views_insert_authenticated"?\s+on\s+(public\.)?proposal_views/i.test(sql),
      ).toBe(true);
    });

    it("the replacement INSERT policy ties the row to the caller + the proposal's org", () => {
      const idx = normalized.indexOf("create policy \"proposal_views_insert_self\"");
      expect(idx, "proposal_views_insert_self policy must exist").toBeGreaterThan(-1);
      const body = normalized.slice(idx, idx + 600);
      expect(body.includes("auth.uid()"), "must scope to the calling user").toBe(true);
      expect(body.includes("proposals"), "must derive org_id from the referenced proposal").toBe(true);
      // and must NOT be a bare `with check (true)`
      expect(/with\s+check\s*\(\s*true\s*\)/.test(body)).toBe(false);
    });
  });

  describe("branding bucket no longer exposes a broad public list policy", () => {
    it("branding_public_read (broad SELECT/list) is dropped", () => {
      expect(
        /drop\s+policy\s+if\s+exists\s+"?branding_public_read"?\s+on\s+storage\.objects/i.test(sql),
      ).toBe(true);
    });
  });
});
