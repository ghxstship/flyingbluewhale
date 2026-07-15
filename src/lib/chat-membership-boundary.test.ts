import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Chat membership-boundary canon (ADR-0008 Amendment 5).
 *
 * ADR-0008 Amendment 5 decided that `ChatSurface` is deliberately NOT
 * project-scoped the way `DirectorySurface`/`FeedSurface` are, because room
 * membership is a finer boundary and — unlike `memberships` — it is one RLS can
 * actually key on. That rationale rests on two load-bearing facts. This guard
 * pins both, because if either quietly stops being true the ADR turns into a
 * confident essay defending a hole.
 *
 * **Fact 1 — you cannot grant yourself membership.** Until
 * `20260715180000_chat_membership_boundary.sql`, you could: any org member could
 * enumerate `chat_rooms`, INSERT `{room_id, user_id: self}`, and read the thread
 * (confirmed against the live DB with a plain `member`-band login). Membership is
 * granted BY someone; it is never taken.
 *
 * **Fact 2 — `chat_rooms` has no `project_id`.** Half of Amendment 5's argument
 * is that project scope isn't even expressible here ("which project does a DM
 * belong to?"). If a migration adds the column, that half expires and the
 * decision deserves a fresh look rather than inheriting this one.
 *
 * Pure-text guard over the migrations (no live DB), mirroring
 * src/lib/schedule-rls-crew-canon.test.ts: resolve the LAST (effective)
 * definition of each policy and assert its shape.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");
const CHAT_TABLES = ["chat_rooms", "chat_room_members", "chat_messages"] as const;

/**
 * Tables whose policies must not rely on the FOR ALL write-check inheritance.
 *
 * Chat is where it bit; time-off is where the same audit found it again (any
 * org member could approve their own leave and set their own balance); the
 * `ai_*` trio were the last three FOR ALL policies in the live DB relying on
 * the inheritance — harmless there (their USING is the write check you'd write
 * anyway), made explicit so this rule has no "known exceptions".
 *
 * Not the whole schema: the baseline's 357 FOR ALL policies are not all
 * re-declared in a form this text scan can resolve. The live invariant is
 * `select count(*) from pg_policies where cmd='ALL' and with_check is null and
 * qual is not null` = 0, which is worth re-running after any RLS migration.
 */
const GUARDED_TABLES = [
  "shifts",
  ...CHAT_TABLES,
  "time_off_requests",
  "time_off_balances",
  "ai_proposal_drafts",
  "ai_risk_reports",
  "ai_schedule_suggestions",
] as const;

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort();
}

/**
 * The LIVE policies on a table: replay every create/alter/drop across the
 * migrations in order and keep what survives.
 *
 * Replaying drops is the whole point — a policy that a later migration dropped
 * is not the schema, and a guard that reads dropped policies as live would fail
 * on the very migrations that fixed the thing it guards.
 *
 * `alter policy` is appended to the create rather than replacing it, because an
 * ALTER may restate only some clauses. Concatenating means a `with check` added
 * by a later ALTER counts, without the create's own clauses being lost.
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

/** The effective definition of a named policy, or null if it isn't live. */
function lastPolicyBody(table: string, policy: string): string | null {
  return livePolicies(table).get(policy) ?? null;
}

/** The WITH CHECK clause of a policy body, or null if it has none. */
function withCheckOf(body: string): string | null {
  const m = body.match(/with\s+check\s*\(([\s\S]*)\)\s*;?\s*$/i);
  return m ? m[1]! : null;
}

/** Strip SQL line comments so prose about a predicate isn't read as one. */
function stripSql(src: string): string {
  return src.replace(/--.*$/gm, "");
}

describe("chat membership boundary canon (ADR-0008 Amendment 5)", () => {
  it("no effective chat policy is FOR ALL with a USING and no WITH CHECK", () => {
    // This is the mechanism that caused the vulnerability, so guard the
    // mechanism and not just the one instance. A policy with no FOR clause is
    // FOR ALL, and for FOR ALL Postgres silently reuses USING as the write
    // check when WITH CHECK is omitted. That is how the R-15 recursion fix
    // turned a read rule ("rows of rooms you belong to") into a write rule
    // ("you may insert yourself into any room") without anyone reading it that
    // way — its own header says "no new access is introduced".
    //
    // Chat policies must therefore be explicit per-command. Then a read rule
    // cannot become a write rule by omission.
    const offenders: string[] = [];
    const live = new Map<string, string>();
    for (const table of GUARDED_TABLES) {
      for (const [policy, body] of livePolicies(table)) live.set(`${table}.${policy}`, body);
    }

    for (const [key, raw] of live) {
      const body = stripSql(raw);
      const isForAll = !/\bfor\s+(select|insert|update|delete)\b/i.test(body);
      const hasUsing = /\busing\s*\(/i.test(body);
      const hasWithCheck = /\bwith\s+check\s*\(/i.test(body);
      if (isForAll && hasUsing && !hasWithCheck) offenders.push(key);
    }

    expect(
      offenders,
      "A FOR ALL policy with USING and no WITH CHECK silently reuses USING as its write check — " +
        "the exact trap that let any org member self-join any chat room (ADR-0008 Amendment 5). " +
        "Declare chat policies per-command (FOR SELECT / FOR INSERT / …) so a read rule can never " +
        "become a write rule by omission.\n\n" +
        offenders.join("\n"),
    ).toEqual([]);
  });

  it("the effective chat_room_members INSERT check does not permit a self-service join", () => {
    const body = lastPolicyBody("chat_room_members", "chat_room_members_insert");
    expect(body, "chat_room_members_insert policy must exist").toBeTruthy();

    const check = withCheckOf(stripSql(body!));
    expect(check, "chat_room_members_insert must declare a WITH CHECK").toBeTruthy();

    // `user_id = auth.uid()` as a disjunct IS the vulnerability: a WITH CHECK
    // cannot tell "adding myself to the room I just made" from "adding myself
    // to your DM". Bootstrap is expressed as `is_room_creator` instead, which
    // can tell the difference.
    expect(
      /user_id\s*=\s*\(?\s*select\s+auth\.uid\(\)/i.test(check!) || /user_id\s*=\s*auth\.uid\(\)/i.test(check!),
      "chat_room_members INSERT must not admit `user_id = auth.uid()` — that lets any org member " +
        "insert a self-issued membership row into any room and read the thread (ADR-0008 Amendment 5). " +
        "Room creators bootstrap via private.is_room_creator(); everyone else is added by an owner/admin.",
    ).toBe(false);

    expect(
      /is_room_creator/i.test(check!) && /is_room_admin/i.test(check!),
      "chat_room_members INSERT should admit exactly the creator-bootstrap and owner/admin paths.",
    ).toBe(true);
  });

  it("the effective chat_messages INSERT check keeps its org pin", () => {
    const body = lastPolicyBody("chat_messages", "chat_messages_insert");
    expect(body, "chat_messages_insert policy must exist").toBeTruthy();
    const check = withCheckOf(stripSql(body!));
    expect(
      /is_org_member/i.test(check ?? ""),
      "chat_messages INSERT lost its is_org_member(org_id) pin — a member could post a message " +
        "carrying a forged org_id. The R-15 recursion fix dropped this once already.",
    ).toBe(true);
  });

  it("time-off writes are manager-gated, and self-filing cannot be born approved", () => {
    // Same class as the chat self-join, found by the same audit: the app's
    // isManagerPlus gate was the only thing stopping a member approving their
    // own leave. RLS admitted any org member to write any request or balance.
    const upd = withCheckOf(stripSql(lastPolicyBody("time_off_requests", "time_off_requests_update") ?? ""));
    expect(
      /has_org_role/i.test(upd ?? ""),
      "time_off_requests UPDATE must be manager-gated in the DB, not just in decideTimeOffRequest — " +
        "a PostgREST call never runs the app's isManagerPlus check.",
    ).toBe(true);

    const ins = withCheckOf(stripSql(lastPolicyBody("time_off_requests", "time_off_requests_insert") ?? ""));
    expect(
      /request_state\s*=\s*'pending'/i.test(ins ?? ""),
      "time_off_requests INSERT must pin self-filed rows to request_state='pending'. Without it a member " +
        "can INSERT a row that is already 'approved' and skip the decision entirely.",
    ).toBe(true);

    for (const cmd of ["insert", "update", "delete"] as const) {
      const body = lastPolicyBody("time_off_balances", `time_off_balances_${cmd}`);
      expect(body, `time_off_balances_${cmd} policy must exist`).toBeTruthy();
      expect(
        /has_org_role/i.test(stripSql(body!)),
        `time_off_balances ${cmd.toUpperCase()} must be manager-gated — members could otherwise set their ` +
          `own balance_hours (and everyone else's). The approve RPC is SECURITY DEFINER and does the ` +
          `decrement itself, so members never need write access here.`,
      ).toBe(true);
    }
  });

  it("approve_time_off_request enforces the manager band and refuses self-approval", () => {
    // SECURITY DEFINER + EXECUTE granted to `authenticated` means RLS is bypassed
    // and every check must be inside the body. It used to check only
    // is_org_member, which is not authority to decide leave.
    const files = migrationFiles();
    let body: string | null = null;
    for (const name of files) {
      const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
      const m = txt.match(/create\s+or\s+replace\s+function\s+"?public"?\.?"?approve_time_off_request[\s\S]*?\$\$;/i);
      if (m) body = m[0];
    }
    expect(body, "approve_time_off_request must be defined in a migration").toBeTruthy();
    const src = stripSql(body!);
    expect(
      /has_org_role\s*\(\s*v_req\.org_id/i.test(src),
      "approve_time_off_request must check the manager band before mutating — it bypasses RLS.",
    ).toBe(true);
    expect(
      /v_req\.user_id\s*=\s*\(\s*select\s+auth\.uid\(\)/i.test(src),
      "approve_time_off_request must refuse self-approval. Managers file leave too, and their own request " +
        "is precisely the one they must not be able to sign off.",
    ).toBe(true);
  });

  it("every chat membership helper pins to live org membership", () => {
    // Amendment 5 part 3. Without this, a soft-deleted `memberships` row does not
    // revoke chat: the user's chat_room_members rows ARE read access, and the
    // offboard cascade sweeping them is the only thing that revokes. A teardown
    // is not a boundary. The pin lives in the helpers rather than each policy
    // because every chat policy routes through them — including future ones.
    const files = migrationFiles();
    for (const fn of ["is_room_member", "is_room_admin", "is_room_creator"] as const) {
      let body: string | null = null;
      for (const name of files) {
        const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
        const re = new RegExp(`create\\s+or\\s+replace\\s+function\\s+private\\.${fn}[\\s\\S]*?\\$\\$;`, "gi");
        const all = txt.match(re);
        if (all?.length) body = all[all.length - 1]!;
      }
      expect(body, `private.${fn} must be defined in a migration`).toBeTruthy();
      expect(
        /is_org_member/i.test(stripSql(body!)),
        `private.${fn} lost its is_org_member pin. An offboarded user's chat_room_members rows would ` +
          `again be live chat access, making the offboard cascade the only lock (ADR-0008 Am. 5 part 3).`,
      ).toBe(true);
    }
  });

  it("the shifts staff band names manager, and not the dead `controller` string", () => {
    // Amendment 5 part 3. The old band was ['owner','admin','controller',
    // 'collaborator'] and leaned on an is_org_member disjunct to let managers
    // through. `controller` is neither a role nor a persona (see
    // policy-vocabulary-canon.test.ts), so dropping is_org_member without adding
    // `manager` would have cut every manager off from every shift.
    const body = lastPolicyBody("shifts", "shifts_select_consolidated");
    expect(body, "shifts_select_consolidated must exist").toBeTruthy();
    const src = stripSql(body!);
    expect(
      /'manager'/i.test(src),
      "shifts SELECT dropped 'manager' from its staff band — managers lose the schedule entirely.",
    ).toBe(true);
    expect(
      /is_org_member/i.test(src),
      "shifts SELECT regained an is_org_member disjunct, which subsumes every other clause — that is " +
        "the org-wide read that let the vendor persona enumerate the whole schedule.",
    ).toBe(false);
  });

  it("chat_rooms still has no project_id, so Amendment 5's rationale still holds", () => {
    // Read the GENERATED types rather than the migrations: they are regenerated
    // from the live DB, so this reflects the schema that actually exists.
    const types = readFileSync(join(process.cwd(), "src/lib/supabase/database.types.ts"), "utf8");
    const table = types.match(/chat_rooms:\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\}/);
    expect(table, "could not locate the chat_rooms Row type").toBeTruthy();

    expect(
      /\bproject_id\b/.test(table![1]!),
      "chat_rooms gained a project_id. Half of ADR-0008 Amendment 5's reasoning was that project " +
        "scope is not expressible for chat ('which project does a DM belong to?'), so ChatSurface " +
        "deliberately takes no projectId while DirectorySurface/FeedSurface require one. That premise " +
        "just changed — revisit the decision on purpose instead of inheriting it.",
    ).toBe(false);
  });
});
