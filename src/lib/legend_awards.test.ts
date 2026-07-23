import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { awardAchievement, type AwardDb } from "./legend_awards";

/**
 * Ratchet for the LEG3ND badge earn path (readiness SHOULD S-1, migration
 * 20260723172100_legend_course_completion_achievement). Locks:
 *
 *   1. Award idempotency at the mock level: the unique-key upsert with
 *      read-back means the SECOND award of the same (org, achievement, user)
 *      produces NO points credit and reports awarded=false — so the push /
 *      ledger side effects can never double-fire.
 *   2. The completion recording site (completeLessonAction) actually wires
 *      the award + the `badge` push kind.
 *   3. The migration adds the course → achievement link with its FK index.
 */

type Row = Record<string, unknown>;

/** Minimal chainable Supabase stub: canned per-table responses + call log. */
function makeDb(opts: { achievement: Row | null; upsertReturns: Row[]; upsertError?: { message: string } }) {
  const log: { pointsInserts: Row[]; upserts: Array<{ row: Row; opts: Row }> } = { pointsInserts: [], upserts: [] };
  const db: AwardDb = {
    from: vi.fn((table: string) => {
      if (table === "achievements") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          is: () => chain,
          maybeSingle: async () => ({ data: opts.achievement }),
        };
        return chain;
      }
      if (table === "achievement_awards") {
        return {
          upsert: (row: Row, upsertOpts: Row) => {
            log.upserts.push({ row, opts: upsertOpts });
            return { select: async () => ({ data: opts.upsertReturns, error: opts.upsertError ?? null }) };
          },
        };
      }
      if (table === "points_ledger") {
        return {
          insert: async (row: Row) => {
            log.pointsInserts.push(row);
            return { error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  };
  return { db, log };
}

const ACH = { id: "ach-1", name: "First Ascent", points: 150, achievement_state: "active" };
const ARGS = { orgId: "org-1", userId: "user-1", achievementId: "ach-1" } as const;

describe("awardAchievement — idempotency contract", () => {
  it("fresh award: inserts once, credits points once, reports awarded", async () => {
    const { db, log } = makeDb({ achievement: ACH, upsertReturns: [{ id: "award-1" }] });
    const res = await awardAchievement(db, ARGS);
    expect(res).toEqual({ awarded: true, points: 150, name: "First Ascent" });
    expect(log.pointsInserts).toHaveLength(1);
    expect(log.pointsInserts[0]).toMatchObject({
      org_id: "org-1",
      user_id: "user-1",
      points: 150,
      ref_kind: "achievement",
      ref_id: "ach-1",
      source: "legend",
    });
  });

  it("rides the unique (org_id, achievement_id, user_id) key with ignoreDuplicates", async () => {
    const { db, log } = makeDb({ achievement: ACH, upsertReturns: [{ id: "award-1" }] });
    await awardAchievement(db, ARGS);
    expect(log.upserts[0]?.opts).toMatchObject({ onConflict: "org_id,achievement_id,user_id", ignoreDuplicates: true });
  });

  it("second award of the same pair: read-back is empty, NO points credit, awarded=false", async () => {
    // ON CONFLICT DO NOTHING returns zero rows for the losing insert — the
    // read-back gate must swallow the side effects.
    const { db, log } = makeDb({ achievement: ACH, upsertReturns: [] });
    const res = await awardAchievement(db, ARGS);
    expect(res.awarded).toBe(false);
    expect(res.points).toBe(0);
    expect(log.pointsInserts).toHaveLength(0);
  });

  it("archived/missing achievement: never awards", async () => {
    const { db, log } = makeDb({ achievement: null, upsertReturns: [{ id: "x" }] });
    const res = await awardAchievement(db, ARGS);
    expect(res).toEqual({ awarded: false, points: 0, name: null });
    expect(log.pointsInserts).toHaveLength(0);
  });

  it("zero-point achievement: awards without a ledger row", async () => {
    const { db, log } = makeDb({ achievement: { ...ACH, points: 0 }, upsertReturns: [{ id: "award-1" }] });
    const res = await awardAchievement(db, ARGS);
    expect(res.awarded).toBe(true);
    expect(log.pointsInserts).toHaveLength(0);
  });

  it("upsert error: reports not awarded, no points credit", async () => {
    const { db, log } = makeDb({ achievement: ACH, upsertReturns: [], upsertError: { message: "rls" } });
    const res = await awardAchievement(db, ARGS);
    expect(res.awarded).toBe(false);
    expect(log.pointsInserts).toHaveLength(0);
  });
});

describe("completion-site wiring (grep guard)", () => {
  const LEARN_ACTIONS = readFileSync(join(__dirname, "../app/(legend)/legend/learn/actions.ts"), "utf8");

  it("completeLessonAction reads completion_achievement_id and calls awardAchievement", () => {
    expect(LEARN_ACTIONS).toMatch(/completion_achievement_id/);
    expect(LEARN_ACTIONS).toMatch(/awardAchievement\(/);
  });

  it("the badge push rides the catalog `badge` kind (mutable via the notifications matrix)", () => {
    expect(LEARN_ACTIONS).toMatch(/kind: "badge"/);
  });

  it("the push is gated on a FRESH award (no re-notify on re-completion)", () => {
    expect(LEARN_ACTIONS).toMatch(/if \(award\.awarded\)[\s\S]*?sendPushTo/);
  });
});

describe("migration — course → achievement link", () => {
  const MIGRATION = readFileSync(
    join(__dirname, "../../supabase/migrations/20260723172100_legend_course_completion_achievement.sql"),
    "utf8",
  ).toLowerCase();

  it("adds legend_courses.completion_achievement_id referencing achievements", () => {
    expect(MIGRATION).toMatch(
      /alter table public\.legend_courses[\s\S]*add column completion_achievement_id uuid references public\.achievements\(id\) on delete set null/,
    );
  });

  it("indexes the new FK (FK-index canon)", () => {
    expect(MIGRATION).toMatch(/create index legend_courses_completion_achievement_idx/);
  });
});
