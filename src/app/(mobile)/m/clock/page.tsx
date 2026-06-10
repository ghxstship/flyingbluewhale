import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CheckInControls } from "./CheckInControls";
import { ShiftConfirmControls } from "./ShiftConfirmControls";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  attendance: "scheduled" | "checked_in" | "on_break" | "checked_out" | "no_show";
  role: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  worker_confirmed_at: string | null;
  venue: { name: string | null } | null;
};

const ATT_TONE: Record<ShiftRow["attendance"], "success" | "info" | "warning" | "muted" | "error"> = {
  scheduled: "muted",
  checked_in: "success",
  on_break: "warning",
  checked_out: "info",
  no_show: "error",
};

export default async function CheckInPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("m.clock.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  // Look up the workforce_member row tied to the current user.
  const { data: wfm } = await supabase
    .from("workforce_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let shifts: ShiftRow[] = [];
  if (wfm?.id) {
    // Today's window — anything starting before midnight tomorrow + ending after now.
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfNextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString();

    const { data } = await supabase
      .from("shifts")
      .select("id, starts_at, ends_at, attendance, role, checked_in_at, checked_out_at, worker_confirmed_at, venue:venue_id(name)")
      .eq("org_id", session.orgId)
      .eq("workforce_member_id", wfm.id)
      .gte("starts_at", startOfDay)
      .lte("starts_at", endOfNextDay)
      .order("starts_at", { ascending: true });
    shifts = (data ?? []) as unknown as ShiftRow[];
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.clock.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.clock.title", undefined, "Check-in")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.clock.subtitle",
          undefined,
          "Today's shifts. Clock in when you arrive, take breaks as needed, clock out when you leave.",
        )}
      </p>

      {!wfm && (
        <div className="surface mt-6 p-4 text-sm">
          {t(
            "m.clock.noWorkforceProfile",
            { userId: session.userId },
            "Your workforce profile isn't linked to this account yet. Ask your supervisor to connect your record to {userId}.",
          )}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {shifts.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.clock.empty.title", undefined, "No Shifts Today")}
              description={t("m.clock.empty.description", undefined, "Check back when you're rostered.")}
            />
          </li>
        ) : (
          shifts.map((s) => (
            <li key={s.id} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {s.venue?.name ?? t("m.clock.unassignedVenue", undefined, "Unassigned venue")}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                    {fmt.time(s.starts_at)}
                    {" – "}
                    {fmt.time(s.ends_at)}
                    {s.role ? ` · ${s.role}` : ""}
                  </div>
                  {(s.checked_in_at || s.checked_out_at) && (
                    <div className="mt-2 font-mono text-xs text-[var(--p-text-2)]">
                      {s.checked_in_at && (
                        <>
                          {t("m.clock.inLabel", undefined, "In")}{" "}
                          {fmt.dateParts(s.checked_in_at, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                      {s.checked_in_at && s.checked_out_at && " · "}
                      {s.checked_out_at && (
                        <>
                          {t("m.clock.outLabel", undefined, "Out")}{" "}
                          {fmt.dateParts(s.checked_out_at, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Badge variant={ATT_TONE[s.attendance]}>{toTitle(s.attendance)}</Badge>
              </div>
              {/* Confirmation quick-action (Connecteam parity) — only for
                  scheduled shifts not yet confirmed. Sits above the clock-in
                  controls so the user sees it before the shift starts. */}
              {s.attendance === "scheduled" && (
                <div className="mt-3 border-t border-[var(--p-border)] pt-3">
                  <ShiftConfirmControls shiftId={s.id} confirmedAt={s.worker_confirmed_at} />
                </div>
              )}
              <div className="mt-3">
                <CheckInControls shiftId={s.id} attendance={s.attendance} />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
