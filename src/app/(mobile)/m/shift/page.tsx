import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  attendance: "scheduled" | "checked_in" | "on_break" | "checked_out" | "no_show" | string;
  role: string | null;
  break_minutes: number;
  meal_credit: boolean;
  checked_in_at: string | null;
  checked_out_at: string | null;
  venue: { name: string | null } | null;
};

const ATT_TONE: Record<string, "muted" | "success" | "warning" | "info" | "error"> = {
  scheduled: "muted",
  checked_in: "success",
  on_break: "warning",
  checked_out: "info",
  no_show: "error",
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default async function MobileShiftPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: wfm } = await supabase
    .from("workforce_members")
    .select("id, full_name, role")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let shifts: ShiftRow[] = [];
  if (wfm?.id) {
    const today = new Date();
    const startOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString();
    const { data } = await supabase
      .from("shifts")
      .select(
        "id, starts_at, ends_at, attendance, role, break_minutes, meal_credit, checked_in_at, checked_out_at, venue:venue_id(name)",
      )
      .eq("org_id", session.orgId)
      .eq("workforce_member_id", wfm.id)
      .gte("starts_at", startOfWindow)
      .lt("starts_at", endOfWindow)
      .order("starts_at", { ascending: true });
    shifts = (data ?? []) as unknown as ShiftRow[];
  }

  // Bucket: today's active vs upcoming
  const todayKey = new Date().toDateString();
  const todayShifts = shifts.filter((s) => new Date(s.starts_at).toDateString() === todayKey);
  const upcoming = shifts.filter((s) => new Date(s.starts_at).toDateString() !== todayKey);

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">My shift</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {wfm ? `Hello, ${wfm.full_name}.` : "Welcome."} Use{" "}
        <Link href="/m/checkin" className="text-[var(--org-primary)]">
          check-in
        </Link>{" "}
        to clock in / out and take breaks.
      </p>

      {!wfm && (
        <div className="surface mt-6 p-4 text-sm">
          Your workforce profile isn't linked to this account yet. Ask your supervisor to connect your record.
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Today</h2>
        <ul className="mt-3 space-y-2">
          {todayShifts.length === 0 ? (
            <li>
              <EmptyState size="compact" title="No shift today" />
            </li>
          ) : (
            todayShifts.map((s) => (
              <li key={s.id} className="surface-raised p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{s.venue?.name ?? "Unassigned venue"}</div>
                    <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      {fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}
                      {s.role ? ` · ${s.role}` : wfm?.role ? ` · ${wfm.role}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {s.break_minutes > 0 && <Badge variant="muted">Break {s.break_minutes}m</Badge>}
                      {s.meal_credit && <Badge variant="success">Meal credit</Badge>}
                    </div>
                  </div>
                  <Badge variant={ATT_TONE[s.attendance] ?? "muted"}>{s.attendance.replace(/_/g, " ")}</Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {upcoming.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Upcoming this week
          </h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((s) => (
              <li key={s.id} className="surface flex items-center justify-between p-3">
                <div className="text-sm">
                  <div className="font-medium">{s.venue?.name ?? "Unassigned venue"}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">
                    {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}
                  </div>
                </div>
                <Badge variant="muted">{s.attendance.replace(/_/g, " ")}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid grid-cols-2 gap-2">
        <Link href="/m/checkin" className="btn btn-primary">
          Check in
        </Link>
        <Link href="/m/shift/swap" className="btn btn-secondary">
          Swap shift
        </Link>
      </div>
    </div>
  );
}
