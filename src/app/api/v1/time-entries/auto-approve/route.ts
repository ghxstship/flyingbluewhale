import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  // Acceptable schedule variance in minutes before flagging.
  variance_threshold_minutes: z.number().int().min(0).max(480).default(30),
  // Maximum single-entry duration before flagging as suspicious.
  max_duration_minutes: z.number().int().min(60).max(1440).default(720),
});

type TimeEntry = {
  id: string;
  duration_minutes: number | null;
  started_at: string;
  billable: boolean | null;
  description: string | null;
  approved: boolean | null;
};

type ApprovalResult = {
  id: string;
  action: "approved" | "flagged";
  reason?: string;
};

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Fetch unapproved entries for this org.
  const { data: entries, error } = await supabase
    .from("time_entries")
    .select("id, duration_minutes, started_at, billable, description, approved")
    .eq("org_id", session.orgId)
    .is("approved", null)
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) return apiError("internal", error.message);

  const rows = (entries ?? []) as TimeEntry[];
  const results: ApprovalResult[] = [];
  const toApprove: string[] = [];

  for (const entry of rows) {
    const flags: string[] = [];

    if (entry.duration_minutes == null || entry.duration_minutes <= 0) {
      flags.push("missing duration");
    }

    if (entry.duration_minutes != null && entry.duration_minutes > input.max_duration_minutes) {
      flags.push(`duration ${entry.duration_minutes}m exceeds ${input.max_duration_minutes}m cap`);
    }

    if (!entry.started_at) {
      flags.push("missing start time");
    }

    if (flags.length > 0) {
      results.push({ id: entry.id, action: "flagged", reason: flags.join("; ") });
    } else {
      toApprove.push(entry.id);
      results.push({ id: entry.id, action: "approved" });
    }
  }

  if (toApprove.length > 0) {
    await supabase
      .from("time_entries")
      .update({ approved: true })
      .in("id", toApprove)
      .eq("org_id", session.orgId);
  }

  const approved = results.filter((r) => r.action === "approved").length;
  const flagged = results.filter((r) => r.action === "flagged").length;

  return apiOk({
    processed: rows.length,
    approved,
    flagged,
    results,
  });
}
