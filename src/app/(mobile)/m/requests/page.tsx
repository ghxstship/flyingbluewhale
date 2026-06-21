import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { RequestsView, type RequestRow } from "./RequestsView";

export const dynamic = "force-dynamic";

type TimeOffRow = {
  id: string;
  user_id: string;
  request_state: string;
  reason: string | null;
  starts_on: string | null;
  ends_on: string | null;
  hours_requested: number | null;
  created_at: string;
};

type SwapRow = {
  id: string;
  requested_by: string;
  target_user_id: string | null;
  swap_state: string;
  reason: string | null;
  created_at: string;
};

/**
 * /m/requests — the field approvals queue. Two inline request domains
 * live behind it: time-off (`time_off_requests`) and shift swaps
 * (`shift_swaps`). Manager+ can approve/decline; everyone sees their own
 * request status. The surviving client `RequestsView` owns the
 * search/filter/decide UI; this server page assembles the rows.
 */
export default async function MobileRequestsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.requests.eyebrow", undefined, "Field")}</div>
        <h1 className="scr-h">{t("m.requests.title", undefined, "Approvals")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const manager = isManagerPlus(session);

  const [timeOffRes, swapRes] = await Promise.all([
    supabase
      .from("time_off_requests")
      .select("id, user_id, request_state, reason, starts_on, ends_on, hours_requested, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("shift_swaps")
      .select("id, requested_by, target_user_id, swap_state, reason, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const timeOff = (timeOffRes.data ?? []) as TimeOffRow[];
  const swaps = (swapRes.data ?? []) as SwapRow[];

  // Hydrate submitter names in one round trip.
  const userIds = Array.from(
    new Set([...timeOff.map((r) => r.user_id), ...swaps.map((r) => r.requested_by)].filter(Boolean)),
  );
  const nameMap = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameMap.set(u.id, u.name || u.email || t("m.requests.someone", undefined, "Someone"));
    }
  }
  const nameFor = (id: string | null) =>
    (id && nameMap.get(id)) || t("m.requests.someone", undefined, "Someone");

  const rows: RequestRow[] = [
    ...timeOff.map<RequestRow>((r) => {
      const range =
        r.starts_on && r.ends_on
          ? `${fmt.date(r.starts_on)} – ${fmt.date(r.ends_on)}`
          : r.starts_on
            ? fmt.date(r.starts_on)
            : t("m.requests.timeOff.title", undefined, "Time Off");
      return {
        id: r.id,
        kind: "time_off",
        type: t("m.requests.type.timeOff", undefined, "Time Off"),
        title: range,
        submitter: nameFor(r.user_id),
        detail: r.reason,
        state: r.request_state,
        submitted: fmt.date(r.created_at),
        meta: r.hours_requested
          ? t("m.requests.hours", { hours: r.hours_requested }, `${r.hours_requested} hrs`)
          : null,
      };
    }),
    ...swaps.map<RequestRow>((r) => ({
      id: r.id,
      kind: "shift_swap",
      type: t("m.requests.type.shiftSwap", undefined, "Shift Swap"),
      title: r.target_user_id
        ? t("m.requests.swap.toTitle", { who: nameFor(r.target_user_id) }, `Swap to ${nameFor(r.target_user_id)}`)
        : t("m.requests.swap.title", undefined, "Shift Swap"),
      submitter: nameFor(r.requested_by),
      detail: r.reason,
      state: r.swap_state,
      submitted: fmt.date(r.created_at),
      meta: null,
    })),
  ];

  return (
    <RequestsView
      rows={rows}
      manager={manager}
      eyebrow={t("m.requests.eyebrow", undefined, "Field")}
      title={t("m.requests.title", undefined, "Approvals")}
    />
  );
}
