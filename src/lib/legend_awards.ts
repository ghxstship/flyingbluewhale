/**
 * Achievement award writer — the ONE earn path for `achievement_awards`
 * (readiness SHOULD S-1: the badges gallery rendered an earned state nothing
 * could ever produce). Called from the course-completion recording site
 * (`completeLessonAction`) when the course carries a
 * `completion_achievement_id` (migration 20260723120100).
 *
 * Idempotent by construction: the insert rides the table's unique
 * (org_id, achievement_id, user_id) key with `ignoreDuplicates`, and the
 * read-back (`select` returns the row ONLY when it was newly inserted)
 * gates the side effects — points are credited to `points_ledger` and the
 * badge push fires at most once per user + achievement, even under a
 * double-submit race (the losing insert returns zero rows).
 *
 * Takes the db as a structural parameter so the award contract is unit-
 * testable without a live client (`src/lib/legend_awards.test.ts`).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type AwardDb = { from: (table: string) => any };
/* eslint-enable @typescript-eslint/no-explicit-any */

export type AwardResult = {
  /** True only when the award row was newly inserted by THIS call. */
  awarded: boolean;
  /** Achievement points credited to the ledger (0 when not awarded). */
  points: number;
  name: string | null;
};

export async function awardAchievement(
  db: AwardDb,
  opts: {
    orgId: string;
    userId: string;
    achievementId: string;
    source?: "legend" | "compvss" | "manual";
    note?: string;
  },
): Promise<AwardResult> {
  const { orgId, userId, achievementId, source = "legend", note } = opts;

  // Only active, org-scoped achievements are earnable.
  const { data: achievement } = await db
    .from("achievements")
    .select("id, name, points, achievement_state")
    .eq("org_id", orgId)
    .eq("id", achievementId)
    .eq("achievement_state", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (!achievement) return { awarded: false, points: 0, name: null };

  // Idempotent award: ON CONFLICT DO NOTHING on (org_id, achievement_id,
  // user_id); the select read-back returns rows only for a fresh insert.
  const { data: inserted, error } = await db
    .from("achievement_awards")
    .upsert(
      {
        org_id: orgId,
        achievement_id: achievementId,
        user_id: userId,
        source,
        note: note ?? null,
      },
      { onConflict: "org_id,achievement_id,user_id", ignoreDuplicates: true },
    )
    .select("id");
  if (error) return { awarded: false, points: 0, name: achievement.name ?? null };

  const newlyAwarded = Array.isArray(inserted) && inserted.length > 0;
  if (!newlyAwarded) return { awarded: false, points: 0, name: achievement.name ?? null };

  // Points ride the shared ledger so the Arena leaderboard reflects the earn.
  // Gated on the fresh insert above, so a duplicate call can't double-credit.
  const points = (achievement.points as number | null) ?? 0;
  if (points > 0) {
    await db.from("points_ledger").insert({
      org_id: orgId,
      user_id: userId,
      points,
      reason: `Earned ${achievement.name ?? "achievement"}`,
      source,
      ref_kind: "achievement",
      ref_id: achievementId,
    });
  }
  return { awarded: true, points, name: (achievement.name as string | null) ?? null };
}
