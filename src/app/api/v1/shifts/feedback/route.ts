import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** POST /api/v1/shifts/feedback — Shift Pulse survey submission.
 * Accepts a mood + fatigue rating (1–5) after a user clocks out.
 * Idempotent: duplicate submissions for the same shift return 200. */

const PostSchema = z.object({
  shiftId: z.string().uuid(),
  mood: z.number().int().min(1).max(5),
  fatigue: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();

    // Verify the shift belongs to this org and the user clocked out.
    const { data: shift } = await supabase
      .from("shifts")
      .select("id, attendance, workforce_member_id")
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .maybeSingle();

    if (!shift) return apiError("not_found", "Shift not found");
    if (shift.attendance !== "checked_out") {
      return apiError("bad_request", "Feedback is only available after clocking out");
    }

    const { error } = await supabase.from("shift_feedback").upsert(
      {
        org_id: session.orgId,
        shift_id: input.shiftId,
        user_id: session.userId,
        mood: input.mood,
        fatigue: input.fatigue,
        comment: input.comment ?? null,
      },
      { onConflict: "shift_id,user_id", ignoreDuplicates: false },
    );

    if (error) return apiError("server_error", error.message);
    return apiOk({ submitted: true });
  });
}
