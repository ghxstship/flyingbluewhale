import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { decideSwap } from "./actions";

export const dynamic = "force-dynamic";

type Swap = {
  id: string;
  shift_id: string;
  requested_by: string;
  target_user_id: string | null;
  reason: string | null;
  swap_state: string;
  created_at: string;
};

type ShiftRef = {
  id: string;
  starts_at: string;
  ends_at: string;
  role: string | null;
  venue: { name: string | null } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Shift Swaps" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: swaps } = await supabase
    .from("shift_swaps")
    .select("id, shift_id, requested_by, target_user_id, reason, swap_state, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (swaps ?? []) as Swap[];
  const pending = rows.filter((r) => r.swap_state === "requested" || r.swap_state === "accepted");

  // Hydrate shift + user labels for display.
  const shiftIds = Array.from(new Set(rows.map((r) => r.shift_id)));
  const userIds = Array.from(
    new Set([...rows.map((r) => r.requested_by), ...rows.map((r) => r.target_user_id).filter((u): u is string => !!u)]),
  );
  const [{ data: shifts }, { data: users }] = await Promise.all([
    shiftIds.length
      ? supabase
          .from("shifts")
          .select("id, starts_at, ends_at, role, venue:venue_id(name)")
          .eq("org_id", session.orgId)
          .in("id", shiftIds)
      : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("users").select("id, email, name").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);
  const shiftMap = new Map(((shifts ?? []) as unknown as ShiftRef[]).map((s) => [s.id, s]));
  const userMap = new Map(
    ((users ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Shift Swaps"
        subtitle={`${pending.length} pending of ${rows.length} total`}
      />
      <div className="page-content space-y-3">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm">No swap requests yet.</div>
        ) : (
          rows.map((r) => {
            const shift = shiftMap.get(r.shift_id);
            const tone =
              r.swap_state === "approved"
                ? "success"
                : r.swap_state === "declined" || r.swap_state === "cancelled"
                  ? "muted"
                  : "info";
            return (
              <div key={r.id} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant={tone}>{r.swap_state}</Badge>
                    <h3 className="mt-2 text-sm font-semibold">{userMap.get(r.requested_by) ?? "Unknown"}</h3>
                    {shift && (
                      <p className="font-mono text-xs text-[var(--text-muted)]">
                        {shift.venue?.name ?? "venue TBD"} ·{" "}
                        {fmt.dateParts(shift.starts_at, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                        {fmt.time(shift.starts_at)}–{fmt.time(shift.ends_at)}
                        {shift.role ? ` · ${shift.role}` : ""}
                      </p>
                    )}
                    {r.reason && <p className="mt-2 text-xs">{r.reason}</p>}
                  </div>
                  {(r.swap_state === "requested" || r.swap_state === "accepted") && (
                    <div className="flex flex-col gap-2">
                      <form action={decideSwap}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <Button type="submit" size="sm" className="w-full">Approve</Button>
                      </form>
                      <form action={decideSwap}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="declined" />
                        <Button type="submit" size="sm" variant="secondary" className="w-full">Decline</Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
