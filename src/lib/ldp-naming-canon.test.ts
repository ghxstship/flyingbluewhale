import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * LDP naming canon guardrail.
 *
 * Per CLAUDE.md (`Conventions › Lifecycle naming discipline (LDP)`):
 *   "New schema-bearing columns MUST be named `*_phase` (sequential macro
 *    arc) or `*_state` (cyclical operational), per LIFECYCLE_DECOMPOSITION_PROTOCOL.md
 *    §NAMING DISCIPLINE. **`status` is banned in new tables**."
 *
 * This spec parses every Supabase migration file and asserts that:
 *   - No CREATE TABLE statement declares a `status` column.
 *   - No ALTER TABLE … ADD COLUMN statement adds a `status` column.
 *
 * Existing migrations that pre-date LDP enforcement are frozen historical
 * record and listed in `LEGACY_ALLOWLIST` below. New migrations must use
 * the canonical lifecycle column names (`xpms_phase`, `production_phase`,
 * `ual_state`, `uis_lifecycle_state`, `accounting_period_state`,
 * `subscription_state`, etc — see CLAUDE.md for the eight canonical
 * lifecycles).
 */

const REPO_ROOT = process.cwd();
const MIGRATIONS_DIR = join(REPO_ROOT, "supabase/migrations");

// Migrations that PRE-DATE LDP enforcement (started ~2026-05-09). These are
// historical record and remain frozen — the LDP_NAMING_AUDIT_v2 report
// already inventories the legacy `status` columns + their canonical
// rename destination. Adding new files to this list is the antipattern
// this spec is meant to catch.
const LEGACY_ALLOWLIST = new Set<string>([
  // Initial remote DB snapshot (44 grandfathered status columns).
  "0001_remote_snapshot.sql",
  // Marketplace canon (May 2026, pre-LDP) — uses `status` for talent_offers,
  // job_applications, etc. Documented in LDP_NAMING_AUDIT_v2.md.
  "0002_marketplace_canon.sql",
  // Booking canon — same pre-LDP era.
  "0003_booking_canon.sql",
  // Salvage City playbook alignment (May 5–8) — pre-LDP window.
  "0004_salvage_city_playbook_v2_alignment.sql",
  "0006_salvage_city_per_diem_travelers_only.sql",
  "0013_salvage_city_offer_letter_playbook_v3_alignment.sql",
  // Onboarding v2 industry lead (May 6) — pre-LDP enforcement window.
  "0007_onboarding_v2_industry_lead.sql",
  // LDP remediation migrations themselves reference `status` while
  // performing the rename — they're allowed to touch the column.
  "0017_ldp_lifecycle_columns.sql",
  "0018_ldp_proposal_phase_status_rename.sql",
  "0020_ldp_lifecycle_remediations_reconciled.sql",
  // USNP canon local parity (May 2026) — recreates pre-LDP table shape
  // for accounting_periods locally so the LDP rename in 0020 has a column
  // to operate on. The `status` column is dropped/renamed downstream.
  "0019_usnp_canon_local_parity.sql",
]);

const STATUS_DECL_RE = /^\s+"?status"?\s+("?(text|character\s+varying|public\.[a-z_]+)"?)/i;
const STATUS_ADD_RE = /ADD\s+COLUMN\s+"?status"?\s+/i;

describe("LDP naming canon", () => {
  it("no migration introduces a `status` column outside the legacy allowlist", () => {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((n) => n.endsWith(".sql"))
      .sort();

    const offenders: Array<{ file: string; line: number; text: string }> = [];

    for (const name of files) {
      if (LEGACY_ALLOWLIST.has(name)) continue;
      const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
      const lines = txt.split("\n");
      lines.forEach((line, idx) => {
        if (STATUS_DECL_RE.test(line) || STATUS_ADD_RE.test(line)) {
          offenders.push({ file: name, line: idx + 1, text: line.trim() });
        }
      });
    }

    const summary = offenders.map((o) => `${o.file}:${o.line} → ${o.text}`).join("\n  ");
    expect(
      offenders,
      `New migrations introduce \`status\` columns — banned by LDP §NAMING DISCIPLINE. Use \`*_phase\` (sequential macro arc) or \`*_state\` (cyclical operational) instead. See LIFECYCLE_DECOMPOSITION_PROTOCOL.md.\n  ${summary}`,
    ).toEqual([]);
  });
});
