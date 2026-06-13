import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  staleThresholdMinutes: z.number().int().min(60).max(1440).default(480),
});

export type ClockStatusEntry = {
  userId: string;
  name: string | null;
  email: string;
  startedAt: string;
  minutesElapsed: number;
};

export type ClockStatusResponse = {
  needsClockOut: ClockStatusEntry[];
  activeCount: number;
};

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const supabase = await createClient();

  const thresholdIso = new Date(Date.now() - input.staleThresholdMinutes * 60 * 1000).toISOString();

  const { data: open, error } = await supabase
    .from("time_entries")
    .select("user_id, started_at, users:user_id(email, name)")
    .eq("org_id", session.orgId)
    .is("ended_at", null)
    .order("started_at", { ascending: true });

  if (error) return apiError("internal", error.message);

  const now = Date.now();
  type RawEntry = {
    user_id: string;
    started_at: string;
    users: { email: string; name: string | null } | null;
  };

  const entries = (open ?? []) as unknown as RawEntry[];
  const activeCount = entries.length;

  const needsClockOut: ClockStatusEntry[] = entries
    .filter((e) => e.started_at < thresholdIso)
    .map((e) => ({
      userId: e.user_id,
      name: e.users?.name ?? null,
      email: e.users?.email ?? "",
      startedAt: e.started_at,
      minutesElapsed: Math.floor((now - new Date(e.started_at).getTime()) / 60_000),
    }));

  return apiOk<ClockStatusResponse>({ needsClockOut, activeCount });
}
