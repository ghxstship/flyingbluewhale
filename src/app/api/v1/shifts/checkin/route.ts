import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";


/** /api/v1/shifts/checkin — COMPVSS shift T&A (WF-197). */

const PostSchema = z.object({
  shiftId: z.string().uuid(),
  action: z.enum(["check_in", "check_out", "break_start", "break_end"]),
  at: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();
    const nowIso = input.at ?? new Date().toISOString();
    const patch: Record<string, string | null> = {};

    if (input.action === "check_in") {
      patch.checked_in_at = nowIso;
      patch.attendance = "checked_in";
    } else if (input.action === "check_out") {
      patch.checked_out_at = nowIso;
      patch.attendance = "checked_out";
    } else if (input.action === "break_start") {
      patch.attendance = "on_break";
    } else {
      patch.attendance = "checked_in";
    }

    const { data, error } = await supabase
      .from("shifts")
      .update(patch as never)
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .select("id, attendance, checked_in_at, checked_out_at")
      .single();

    if (error) return apiError("internal", error.message);
    return apiOk({ shift: data });
  });
}
