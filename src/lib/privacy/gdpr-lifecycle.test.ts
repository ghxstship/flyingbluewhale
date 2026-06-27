import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * GDPR data-lifecycle guard.
 *
 * Locks in the compliance fixes from the 2026-06-25 audit so they can't
 * silently regress:
 *
 *   1. Retention/redaction + account-purge are SCHEDULED (pg_cron).
 *   2. Every FK referencing a user is purge-safe (ON DELETE SET NULL / CASCADE,
 *      never NO ACTION / RESTRICT) — enforced in-DB by the migration's own
 *      assertion block; mirrored here as a source-of-truth contract check.
 *   3. DSAR + data-export actions are audited.
 *
 * The live erasure proof (seed → purge → assert no FK error / no residual PII)
 * runs as a transactional `DO` block against the database during the migration
 * review; see the agent report. This spec is the static CI gate.
 */

const REPO = process.cwd();
const MIGRATIONS = join(REPO, "supabase/migrations");

function migration(substr: string): string {
  const f = readdirSync(MIGRATIONS).find((n) => n.includes(substr));
  if (!f) throw new Error(`migration containing "${substr}" not found`);
  return readFileSync(join(MIGRATIONS, f), "utf8");
}

describe("GDPR cron scheduling (fix #1)", () => {
  const sql = migration("gdpr_purge_and_redaction_cron");

  it("enables pg_cron", () => {
    expect(sql).toMatch(/create\s+extension\s+if\s+not\s+exists\s+pg_cron/i);
  });

  it("schedules the audit-PII redaction job", () => {
    expect(sql).toMatch(/cron\.schedule\(\s*'gdpr-redact-audit-pii'/);
    expect(sql).toContain("run_audit_redaction");
  });

  it("schedules the account purge job", () => {
    expect(sql).toMatch(/cron\.schedule\(\s*'gdpr-purge-accounts'/);
    expect(sql).toContain("purge_deleted_accounts");
  });

  it("ports the purge into a SECURITY DEFINER SQL function that erases identity rows", () => {
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+private\.purge_deleted_accounts/i);
    expect(sql).toMatch(/security\s+definer/i);
    expect(sql).toContain("DELETE FROM public.users");
    expect(sql).toContain("DELETE FROM auth.users");
  });

  it("writes a cron-run log row for failure visibility", () => {
    expect(sql).toContain("private.cron_run_log");
    // both jobs log success AND error paths
    expect(sql.match(/cron_run_log/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it("is idempotent: re-scrubs PII and unschedules before re-scheduling", () => {
    expect(sql).toContain("deleted-' || id || '@deleted.invalid");
    expect(sql).toContain("cron.unschedule");
  });
});

describe("user-FK purge-safety (fix #2)", () => {
  const sql = migration("gdpr_user_fk_on_delete_erasure");

  it("rewires NO ACTION / RESTRICT user FKs to ON DELETE SET NULL (default)", () => {
    expect(sql).toContain("ON DELETE %s");
    expect(sql).toContain("SET NULL");
  });

  it("keeps personal-data rows (ai_conversations) on CASCADE, not SET NULL", () => {
    expect(sql).toContain("ai_conversations.user_id");
    expect(sql).toContain("CASCADE");
  });

  it("carries a self-asserting guard that ZERO user FKs remain NO ACTION/RESTRICT", () => {
    expect(sql).toMatch(/GDPR FK remediation incomplete/);
    expect(sql).toMatch(/confdeltype\s+IN\s*\(\s*'a'\s*,\s*'r'\s*\)/);
  });

  it("the previously-NOT-NULL attribution columns are now nullable in the generated types", () => {
    const types = readFileSync(join(REPO, "src/lib/supabase/database.types.ts"), "utf8");
    // Spot-check the FKs we explicitly dropped NOT NULL on. If any of these
    // regress to non-null, SET NULL would throw and the purge would abort.
    for (const sig of [
      "submitter_id: string | null",
      "requester_id: string | null",
    ]) {
      expect(types).toContain(sig);
    }
  });
});

describe("DSAR + export auditing (fix #3)", () => {
  it("audit action vocabulary covers the GDPR surfaces", () => {
    const audit = readFileSync(join(REPO, "src/lib/audit.ts"), "utf8");
    for (const a of [
      "privacy.dsar.created",
      "privacy.dsar.fulfilled",
      "privacy.data_export",
      "privacy.audit_export",
    ]) {
      expect(audit).toContain(`"${a}"`);
    }
  });

  const callsEmit = (rel: string, action: string) => {
    const src = readFileSync(join(REPO, rel), "utf8");
    expect(src).toContain("emitAudit");
    expect(src).toContain(action);
  };

  it("DSAR API route audits creation", () => {
    callsEmit("src/app/api/v1/privacy/dsar/route.ts", "privacy.dsar.created");
  });

  it("DSAR console create + fulfil audit", () => {
    callsEmit("src/app/(platform)/studio/legal/privacy/dsar/new/actions.ts", "privacy.dsar.created");
    callsEmit("src/app/(platform)/studio/legal/privacy/dsar/[requestId]/edit/actions.ts", "privacy.dsar.fulfilled");
  });

  it("me/export audits the data export", () => {
    callsEmit("src/app/api/v1/me/export/route.ts", "privacy.data_export");
  });

  it("compliance audit-export audits the pull", () => {
    callsEmit("src/app/api/v1/compliance/audit-export/route.tsx", "privacy.audit_export");
  });

  it("me/export covers the Art. 15 marketplace + crew categories", () => {
    const src = readFileSync(join(REPO, "src/app/api/v1/me/export/route.ts"), "utf8");
    for (const tbl of [
      "crew_members",
      "talent_profiles",
      "assignments",
      "reviews",
      "job_applications",
      "open_call_submissions",
    ]) {
      expect(src).toContain(tbl);
    }
  });
});
