import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * /m/checkin — read-only meal-credit + break summary for the caller's
 * shifts today. Distinct purpose from /m/clock (the punch surface):
 * this is the "what was I credited for" view crew use to verify lunch
 * credit applied before they punch out. /m/clock writes; this reads.
 */

type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  attendance: "scheduled" | "checked_in" | "on_break" | "checked_out" | "no_show";
  role: string | null;
  meal_credit: boolean;
  break_minutes: number;
  checked_in_at: string | null;
  checked_out_at: string | null;
  venue: { name: string | null } | null;
};

export default async function CheckinPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("m.checkIn.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: wfm } = await supabase
    .from("workforce_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let shifts: ShiftRow[] = [];
  if (wfm?.id) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data } = await supabase
      .from("shifts")
      .select(
        "id, starts_at, ends_at, attendance, role, meal_credit, break_minutes, checked_in_at, checked_out_at, venue:venue_id(name)",
      )
      .eq("org_id", session.orgId)
      .eq("workforce_member_id", wfm.id)
      .gte("starts_at", startOfDay)
      .lt("starts_at", endOfDay)
      .order("starts_at", { ascending: true });
    shifts = (data ?? []) as unknown as ShiftRow[];
  }

  const totalBreakMinutes = shifts.reduce((acc, s) => acc + (s.break_minutes ?? 0), 0);
  const mealsCredited = shifts.filter((s) => s.meal_credit).length;
  const completed = shifts.filter((s) => s.attendance === "checked_out").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        {t("m.checkInSummary.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.checkInSummary.title", undefined, "Check-in Summary")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {t("m.checkIn.subtitlePrefix", undefined, "Today's clock activity, breaks, and meal credits. Use")}{" "}
        <a className="underline" href="/m/clock">
          /m/clock
        </a>{" "}
        {t("m.checkIn.subtitleSuffix", undefined, "to actually punch in or out.")}
      </p>

      {!wfm && (
        <div className="surface mt-6 p-4 text-sm">
          {t(
            "m.checkIn.noWorkforceProfile",
            undefined,
            "Your workforce profile isn't linked to this account. Ask a supervisor to associate your record.",
          )}
        </div>
      )}

      <section className="mt-5 grid grid-cols-3 gap-2">
        <div className="surface p-3">
          <div className="font-mono text-2xl font-semibold">{shifts.length}</div>
          <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.checkIn.stats.today", undefined, "Today")}
          </div>
        </div>
        <div className="surface p-3">
          <div className="font-mono text-2xl font-semibold">{mealsCredited}</div>
          <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.checkIn.stats.meals", undefined, "Meals")}
          </div>
        </div>
        <div className="surface p-3">
          <div className="font-mono text-2xl font-semibold">{totalBreakMinutes}</div>
          <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.checkIn.stats.breakMin", undefined, "Break min")}
          </div>
        </div>
      </section>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t(
          "m.checkIn.shiftsClosed",
          { completed, total: shifts.length },
          `${completed} of ${shifts.length} shifts closed.`,
        )}
      </p>

      <ul className="mt-5 space-y-3">
        {shifts.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.checkIn.empty.title", undefined, "No Shifts Today")}
              description={t(
                "m.checkIn.empty.description",
                undefined,
                "Check-in totals appear here when you have a shift on the books.",
              )}
            />
          </li>
        ) : (
          shifts.map((s) => (
            <li key={s.id} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {s.venue?.name ?? t("m.checkIn.unassignedVenue", undefined, "Unassigned venue")}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                    {fmt.time(s.starts_at)} – {fmt.time(s.ends_at)}
                    {s.role ? ` · ${s.role}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {s.meal_credit && (
                      <Badge variant="success">{t("m.checkIn.badge.mealCredited", undefined, "Meal credited")}</Badge>
                    )}
                    {s.break_minutes > 0 && (
                      <Badge variant="muted">
                        {t("m.checkIn.badge.breakMinutes", { minutes: s.break_minutes }, `${s.break_minutes}m break`)}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    s.attendance === "checked_out"
                      ? "info"
                      : s.attendance === "checked_in"
                        ? "success"
                        : s.attendance === "on_break"
                          ? "warning"
                          : "muted"
                  }
                >
                  {toTitle(s.attendance)}
                </Badge>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
