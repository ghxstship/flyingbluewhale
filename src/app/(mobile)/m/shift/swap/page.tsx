import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { requestSwap } from "./actions";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  attendance: string;
  role: string | null;
  venue: { name: string | null } | null;
};

export default async function MobileShiftSwapPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string): string => fmt.time(iso);
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  const { data: wfm } = await supabase
    .from("workforce_members")
    .select("id, full_name")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let shifts: ShiftRow[] = [];
  if (wfm?.id) {
    const { data } = await supabase
      .from("shifts")
      .select("id, starts_at, ends_at, attendance, role, venue:venue_id(name)")
      .eq("org_id", session.orgId)
      .eq("workforce_member_id", wfm.id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(20);
    shifts = ((data ?? []) as unknown as ShiftRow[]).filter((s) => s.attendance === "scheduled");
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        {t("m.shift.swap.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.shift.swap.title", undefined, "Swap Shift")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {t(
          "m.shift.swap.intro",
          undefined,
          "Pick an upcoming shift to flag your scheduler. Roster admins get a notification with your reason.",
        )}
      </p>

      {!wfm && (
        <div className="surface mt-6 p-4 text-sm">
          {t(
            "m.shift.swap.noProfile",
            undefined,
            "Your workforce profile isn't linked yet. Ask a supervisor to associate your account.",
          )}
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {shifts.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.shift.swap.empty.title", undefined, "No Upcoming Shifts to Swap")}
              description={t(
                "m.shift.swap.empty.description",
                undefined,
                "Only shifts you haven't checked into can be swapped. See your roster on the Shift screen.",
              )}
              action={
                <Link href="/m/shift" className="btn btn-secondary btn-sm">
                  {t("m.shift.swap.empty.action", undefined, "Open shift")}
                </Link>
              }
            />
          </li>
        ) : (
          shifts.map((s) => (
            <li key={s.id} className="surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {s.venue?.name ?? t("m.shift.swap.unassignedVenue", undefined, "Unassigned venue")}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                    {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}
                    {s.role ? ` · ${s.role}` : ""}
                  </div>
                </div>
                <Badge variant="muted">{toTitle(s.attendance)}</Badge>
              </div>
              <form action={requestSwap} className="mt-3 space-y-2">
                <input type="hidden" name="shift_id" value={s.id} />
                <textarea
                  name="reason"
                  rows={2}
                  maxLength={500}
                  required
                  placeholder={t("m.shift.swap.reasonPlaceholder", undefined, "Reason for swap…")}
                  className="input-base w-full text-sm"
                />
                <button type="submit" className="btn btn-primary btn-sm w-full">
                  {t("m.shift.swap.requestButton", undefined, "Request swap")}
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
