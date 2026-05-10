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

type Attendance = "scheduled" | "checked_in" | "on_break" | "checked_out";
type Action = "check_in" | "check_out" | "break_start" | "break_end";

// Shift T&A FSM. Each action only fires from its valid prior state — a
// stale field PWA double-tap on "Check In" must not re-stamp
// checked_in_at, and "Break End" can't sneak through if the worker
// never started a break. checked_out is terminal for the shift session.
const REQUIRED_FROM: Record<Action, readonly Attendance[]> = {
  check_in: ["scheduled"],
  break_start: ["checked_in"],
  break_end: ["on_break"],
  check_out: ["checked_in", "on_break"],
};

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();

    const { data: row, error: readErr } = await supabase
      .from("shifts")
      .select("id, attendance")
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (readErr) return apiError("internal", readErr.message);
    if (!row) return apiError("not_found", "Shift not found");
    const current = (row as { attendance: Attendance }).attendance ?? "scheduled";
    const allowedFrom = REQUIRED_FROM[input.action];
    if (!allowedFrom.includes(current)) {
      return apiError(
        "conflict",
        `Cannot ${input.action} from ${current}. Allowed prior states: ${allowedFrom.join(", ")}`,
      );
    }

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
      .eq("attendance", current as "scheduled")
      .select("id, attendance, checked_in_at, checked_out_at")
      .maybeSingle();

    if (error) return apiError("internal", error.message);
    if (!data) {
      return apiError("conflict", "Shift attendance changed concurrently — refresh and retry");
    }
    return apiOk({ shift: data });
  });
}
