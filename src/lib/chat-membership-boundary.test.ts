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

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort();
}

/**
 * The LIVE policies on a table: replay every create/drop across the migrations
 * in order and keep what survives.
 *
 * Replaying drops is the whole point — a policy that a later migration dropped
 * is not the schema, and a guard that reads dropped policies as live would fail
 * on the very migrations that fixed the thing it guards.
 */
function livePolicies(table: string): Map<string, string> {
  const live = new Map<string, string>();
  const stmt = new RegExp(
    `drop\\s+policy\\s+(?:if\\s+exists\\s+)?"?([a-z0-9_]+)"?\\s+on\\s+"?public"?\\."?${table}"?\\s*;` +
      `|create\\s+policy\\s+"?([a-z0-9_]+)"?\\s+on\\s+"?public"?\\."?${table}"?[\\s\\S]*?;`,
    "gi",
  );
  for (const name of migrationFiles()) {
    const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
    for (const m of txt.matchAll(stmt)) {
      if (m[1]) live.delete(m[1].toLowerCase());
      else if (m[2]) live.set(m[2].toLowerCase(), m[0]);
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
    for (const table of CHAT_TABLES) {
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
