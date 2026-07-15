import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Identity-boundary canon (ADR-0008 Amendment 7).
 *
 * Amendment 5 found three live escalations by asking one question of four
 * surfaces: does RLS agree, if you skip the app and call PostgREST directly?
 * Amendment 7 asked it of the whole app — 253 identity-narrowed reads across 65
 * tables — and found four more. This guard pins the four fixes, because each one
 * is a predicate whose absence is invisible: the app still filters, every screen
 * still looks right, and only a PostgREST call can tell the difference. That is
 * exactly how all seven got in.
 *
 * The distinction this file encodes, and the reason it does not simply ban
 * `is_org_member`: an app-level identity filter is sometimes a VIEW ("my work")
 * and sometimes a BOUNDARY ("my pay"). `tasks`/`invoices`/`requisitions` are
 * org-readable on purpose — an operator console is the point. The tables below
 * carry a privacy or authority claim, so the database has to hold it.
 *
 * Pure-text guard over the migrations (no live DB), mirroring
 * src/lib/chat-membership-boundary.test.ts: resolve the LAST (effective)
 * definition of each policy by replaying create/alter/drop in filename order,
 * then assert its shape. The live half of the invariant is
 *   select count(*) from pg_policies
 *    where schemaname='public' and cmd='ALL' and with_check is null
 *      and qual is not null;   -- must stay 0
 * which is worth re-running after any RLS migration.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

/**
 * Tables this amendment narrowed, guarded for the FOR ALL inheritance mechanism.
 *
 * `badge_awards` is here because it WAS the mechanism: one `badge_awards_org_rw`
 * FOR ALL policy with `is_org_member` on both sides, which let a plain member
 * award themselves a badge (confirmed live, then removed).
 */
const GUARDED_TABLES = ["time_entries", "reviews", "badge_awards", "achievement_awards"] as const;

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort();
}

/**
 * The LIVE policies on a table: replay every create/alter/drop across the
 * migrations in order and keep what survives. Replaying drops is the whole
 * point — a guard that read dropped policies as live would fail on the very
 * migration that fixed the thing it guards.
 */
function livePolicies(table: string): Map<string, string> {
  const live = new Map<string, string>();
  const stmt = new RegExp(
    `drop\\s+policy\\s+(?:if\\s+exists\\s+)?"?([a-z0-9_]+)"?\\s+on\\s+"?public"?\\."?${table}"?\\s*;` +
      `|create\\s+policy\\s+"?([a-z0-9_]+)"?\\s+on\\s+"?public"?\\."?${table}"?[\\s\\S]*?;` +
      `|alter\\s+policy\\s+"?([a-z0-9_]+)"?\\s+on\\s+"?public"?\\."?${table}"?[\\s\\S]*?;`,
    "gi",
  );
  for (const name of migrationFiles()) {
    const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
    for (const m of txt.matchAll(stmt)) {
      if (m[1]) live.delete(m[1].toLowerCase());
      else if (m[2]) live.set(m[2].toLowerCase(), m[0]);
      else if (m[3]) {
        const key = m[3].toLowerCase();
        const prior = live.get(key);
        if (prior) live.set(key, `${prior}\n${m[0]}`);
      }
    }
  }
  return live;
}

function lastPolicyBody(table: string, policy: string): string | null {
  return livePolicies(table).get(policy) ?? null;
}

/** Strip SQL line comments so prose about a predicate isn't read as one. */
function stripSql(src: string): string {
  return src.replace(/--.*$/gm, "");
}

/** Does a predicate pin a column to the caller? Matches both auth.uid() forms. */
function pinsToCaller(sql: string, column: string): boolean {
  return new RegExp(`${column}\\s*=\\s*\\(?\\s*(?:select\\s+)?auth\\.uid\\(\\)`, "i").test(sql);
}

/** The roles/personas named in every has_org_role(...) band in a predicate. */
function bandsOf(sql: string): string[] {
  const bands: string[] = [];
  for (const m of sql.matchAll(/has_org_role\s*\([\s\S]*?array\s*\[([\s\S]*?)\]/gi)) {
    for (const q of m[1]!.matchAll(/'([a-z_]+)'/gi)) bands.push(q[1]!.toLowerCase());
  }
  return bands;
}

describe("identity boundary canon (ADR-0008 Amendment 7)", () => {
  it("no effective policy on a swept table is FOR ALL with a USING and no WITH CHECK", () => {
    // Guard the mechanism, not just the instance. A policy with no FOR clause is
    // FOR ALL, and Postgres silently reuses USING as the write check when WITH
    // CHECK is omitted — so a read rule ("members may see the badge wall")
    // becomes a write rule ("members may award themselves badges") with nobody
    // writing that down.
    const offenders: string[] = [];
    for (const table of GUARDED_TABLES) {
      for (const [policy, raw] of livePolicies(table)) {
        const body = stripSql(raw);
        const isForAll = !/\bfor\s+(select|insert|update|delete)\b/i.test(body);
        if (isForAll && /\busing\s*\(/i.test(body) && !/\bwith\s+check\s*\(/i.test(body)) {
          offenders.push(`${table}.${policy}`);
        }
      }
    }
    expect(
      offenders,
      "A FOR ALL policy with USING and no WITH CHECK silently reuses USING as its write check. " +
        "Declare per-command policies (FOR SELECT / FOR INSERT / …) so a read rule can never become " +
        "a write rule by omission.\n\n" +
        offenders.join("\n"),
    ).toEqual([]);
  });

  // ── time_entries: payroll ────────────────────────────────────────────────
  //
  // `time_entries_update` granted ['owner','admin','manager','controller',
  // 'collaborator','crew'] with NO user_id pin. private.has_org_role matches
  // `role::text OR persona`, so the `crew` PERSONA matched on a plain `member`
  // role: confirmed live by writing rate_cents onto another user's entry and by
  // forging an 8-hour entry attributed to a third party.

  for (const policy of ["time_entries_insert", "time_entries_update"] as const) {
    it(`${policy} pins non-staff writes to the caller's own row`, () => {
      const body = lastPolicyBody("time_entries", policy);
      expect(body, `${policy} must exist`).toBeTruthy();
      const sql = stripSql(body!);

      expect(
        pinsToCaller(sql, "user_id"),
        `${policy} lost its \`user_id = auth.uid()\` self-pin. Without it every persona in the ` +
          `has_org_role band may write ANY user's payroll row — the app's .eq("user_id", session.userId) ` +
          `filter is not a boundary, and /p/[slug]/crew/time is portal-mounted. ` +
          `mileage_logs and expenses already carry the correct shape; keep time_entries in line.`,
      ).toBe(true);

      expect(
        bandsOf(sql),
        `${policy}'s staff band must not include 'crew'. has_org_role matches role OR persona, so ` +
          `'crew' admits an ordinary member to write other people's time. Crew write their own rows ` +
          `via the self-pin instead.`,
      ).not.toContain("crew");
    });
  }

  it("time_entries SELECT is staff-or-self, not bare org membership", () => {
    const sql = stripSql(lastPolicyBody("time_entries", "time_entries_select") ?? "");
    expect(sql, "time_entries_select must exist").toBeTruthy();
    expect(
      pinsToCaller(sql, "user_id") && /has_org_role/i.test(sql),
      "time_entries SELECT must be `staff OR the person it belongs to`. Rows carry rate_cents, punch " +
        "GPS and pulse notes; org-wide read exposes every coworker's pay and movements. Same shape as " +
        "the shifts narrowing in Amendment 5 part 3.",
    ).toBe(true);
  });

  // ── reviews: the mutual-release blind ───────────────────────────────────
  //
  // Every reviews policy led with `is_org_member(org_id)`, which SUBSUMED the
  // narrow `reviewer_user_id = auth.uid()` disjunct beside it — the same
  // collapsing-disjuncts shape as shifts_select_consolidated. Confirmed live:
  // rewrote another person's review 4★→1★, and read an unreleased one as a
  // third party.

  it("reviews SELECT keeps the release blind — no bare is_org_member disjunct", () => {
    const sql = stripSql(lastPolicyBody("reviews", "reviews_select") ?? "");
    expect(sql, "reviews_select must exist").toBeTruthy();
    expect(
      /is_org_member/i.test(sql),
      "reviews SELECT must not admit bare is_org_member: it subsumes every narrower disjunct beside " +
        "it, letting any member read UNRELEASED reviews and defeating the mutual-release blind that " +
        '/me/reviews already enforces in the app (`.not("released_at","is",null)`). ' +
        "Moderation is the staff band; being in the org is not authority to moderate.",
    ).toBe(false);
    expect(
      /released_at\s+is\s+not\s+null/i.test(sql),
      "reviews SELECT must still expose RELEASED reviews — that is what releasing means.",
    ).toBe(true);
  });

  it("reviews INSERT pins authorship to the caller", () => {
    const sql = stripSql(lastPolicyBody("reviews", "reviews_insert") ?? "");
    expect(sql, "reviews_insert must exist").toBeTruthy();
    expect(
      pinsToCaller(sql, "reviewer_user_id"),
      "reviews INSERT must pin reviewer_user_id to auth.uid(), or any member can publish a review " +
        "under someone else's name. tg_reviews_aggregate rolls ratings up onto the subject, so forged " +
        "authorship forges a public rating.",
    ).toBe(true);
  });

  for (const policy of ["reviews_update", "reviews_delete"] as const) {
    it(`${policy} is limited to the review's author or staff`, () => {
      const sql = stripSql(lastPolicyBody("reviews", policy) ?? "");
      expect(sql, `${policy} must exist`).toBeTruthy();
      expect(
        /is_org_member/i.test(sql),
        `${policy} must not admit bare is_org_member — that let any member rewrite a 4★ review to 1★, ` +
          `or delete the bad review about themselves. Author or staff only.\n\n` +
          `Safe to narrow because tg_reviews_release_pair and tg_reviews_aggregate are both SECURITY ` +
          `DEFINER: the counterpart-release write bypasses RLS, so mutual release still works for a ` +
          `user who cannot UPDATE the counterpart row directly. If either trigger ever loses SECURITY ` +
          `DEFINER, this narrowing breaks release and must be revisited.`,
      ).toBe(false);
    });
  }

  // ── awards: granted BY someone ──────────────────────────────────────────

  for (const table of ["badge_awards", "achievement_awards"] as const) {
    it(`${table} INSERT is staff-gated (an award is not self-granted)`, () => {
      const sql = stripSql(lastPolicyBody(table, `${table}_insert`) ?? "");
      expect(sql, `${table}_insert must exist`).toBeTruthy();
      expect(
        /has_org_role/i.test(sql) && !/is_org_member/i.test(sql),
        `${table} INSERT must be the staff band, not is_org_member — a member could otherwise award ` +
          `themselves (confirmed live). The whole meaning of an award is that someone else gave it. ` +
          `Reads stay org-wide on purpose: the wall is meant to be seen.`,
      ).toBe(true);
    });
  }

  // ── redeem_voucher: SECURITY DEFINER does its own checks ─────────────────

  it("redeem_voucher refuses to credit a user other than the caller", () => {
    const sql = migrationFiles()
      .map((n) => readFileSync(join(MIGRATIONS_DIR, n), "utf8"))
      .filter((t) => /create\s+or\s+replace\s+function\s+public\.redeem_voucher/i.test(t))
      .pop();
    expect(sql, "redeem_voucher must be defined in a migration").toBeTruthy();
    const body = stripSql(sql!);

    expect(
      /p_user_id\s+is\s+distinct\s+from\s+\(?\s*select\s+auth\.uid\(\)/i.test(body) || pinsToCaller(body, "p_user_id"),
      "redeem_voucher is SECURITY DEFINER and bypasses RLS, so every check the policies would have " +
        "made must be in its body. It must refuse unless p_user_id = auth.uid(): the app passes " +
        "session.userId, but a PostgREST caller passes whatever it likes and could credit another " +
        "user's ledger while burning their one redemption (confirmed live). " +
        "approve_time_off_request was the same shape.",
    ).toBe(true);

    expect(
      /is_org_member\s*\(\s*p_org_id/i.test(body),
      "redeem_voucher must verify the caller belongs to p_org_id — without it the function is a " +
        "cross-tenant door for anyone holding a code.",
    ).toBe(true);
  });
});
