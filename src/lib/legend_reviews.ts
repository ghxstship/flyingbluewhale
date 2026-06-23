/**
 * LEG3ND course reviews vocabulary — learner star ratings + written feedback.
 * Backed by migration 20260623160020_legend_course_reviews. Distinct from the
 * marketplace `reviews` table.
 */

export type CourseReview = {
  id: string;
  org_id: string;
  course_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

/** Average of a review set, rounded to 1 dp; 0 when empty. */
export function averageRating(reviews: ReadonlyArray<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** Star-count breakdown (5→1) as percentages of the total. */
export function ratingBreakdown(reviews: ReadonlyArray<{ rating: number }>): Array<{ stars: number; count: number; pct: number }> {
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    return { stars, count, pct: total === 0 ? 0 : Math.round((count / total) * 100) };
  });
}
