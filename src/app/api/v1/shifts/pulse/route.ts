import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** POST /api/v1/shifts/pulse
 *
 * Records a Shift Pulse score (1–5) + optional comment for the
 * authenticated user on a completed shift. One submission per
 * (shift_id, user_id) — duplicate submits return 409.
 *
 * Parity: Deputy "Shift Pulse" end-of-shift feedback loop. */

const PostSchema = z.object({
  shiftId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();

    // Verify the shift belongs to the org and is checked_out.
    const { data: shift, error: shiftErr } = await supabase
      .from("shifts")
      .select("id, attendance, workforce_member_id")
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (shiftErr) return apiError("internal", shiftErr.message);
    if (!shift) return apiError("not_found", "Shift not found");

    const s = shift as { id: string; attendance: string; workforce_member_id: string | null };
    if (s.attendance !== "checked_out") {
      return apiError("conflict", "Pulse can only be submitted after clocking out");
    }

    const { data, error } = await supabase
      .from("shift_pulses")
      .insert({
        org_id: session.orgId,
        shift_id: input.shiftId,
        user_id: session.userId,
        workforce_member_id: s.workforce_member_id ?? null,
        score: input.score,
        comment: input.comment ?? null,
      })
      .select("id, score, submitted_at")
      .single();

    if (error) {
      // Unique constraint violation → already submitted
      if (error.code === "23505") return apiError("conflict", "Pulse already submitted for this shift");
      return apiError("internal", error.message);
    }

    return apiCreated({ pulse: data });
  });
}
