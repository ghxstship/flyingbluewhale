import Link from "next/link";
import { CalendarOff } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Time Off — the caller's own requests + remaining balances. Reads
 * `time_off_requests` (user-scoped) and `time_off_balances`. FAB → request form.
 */
type RequestRow = {
  id: string;
  starts_on: string | null;
  ends_on: string | null;
  hours_requested: number | null;
  reason: string | null;
  request_state: string | null;
};

type BalanceRow = {
  id: string;
  balance_hours: number | null;
  policy: { name: string | null } | null;
};

const STATE_TONE: Record<string, string> = {
  pending: "warn",
  submitted: "warn",
  approved: "ok",
  denied: "danger",
  rejected: "danger",
  cancelled: "neutral",
};

const TONE_VAR: Record<string, string> = {
  danger: "var(--p-danger)",
  warn: "var(--p-warning)",
  ok: "var(--p-success)",
  neutral: "var(--p-border)",
};

export default async function TimeOffPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data: reqData }, { data: balData }] = await Promise.all([
    supabase
      .from("time_off_requests")
      .select("id, starts_on, ends_on, hours_requested, reason, request_state")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .order("starts_on", { ascending: false })
      .limit(100),
    supabase
      .from("time_off_balances")
      .select("id, balance_hours, policy:time_off_policies(name)")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .limit(20),
  ]);

  const requests = (reqData ?? []) as RequestRow[];
  const balances = (balData ?? []) as unknown as BalanceRow[];

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.timeOff.eyebrow", undefined, "You")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.timeOff.title", undefined, "Time Off")}
      </h1>

      {balances.length > 0 && (
        <div className="metarow">
          {balances.map((b) => (
            <div className="m" key={b.id}>
              <div className="k">{b.policy?.name ?? t("m.timeOff.balance", undefined, "Balance")}</div>
              <div className="v">{b.balance_hours != null ? `${b.balance_hours}h` : "—"}</div>
            </div>
          ))}
        </div>
      )}

      <div className="sech">
        <h2>{t("m.timeOff.requests", undefined, "Your Requests")}</h2>
      </div>
      {requests.length === 0 ? (
        <EmptyState
          icon={<CalendarOff size={28} aria-hidden="true" />}
          title={t("m.timeOff.emptyTitle", undefined, "No Requests")}
          description={t("m.timeOff.emptyBody", undefined, "You haven't requested any time off.")}
        />
      ) : (
        requests.map((r) => {
          const tone = STATE_TONE[r.request_state ?? ""] ?? "neutral";
          const fmt = (d: string | null) =>
            d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
          return (
            <div className="item" key={r.id}>
              <span className="bar" style={{ background: TONE_VAR[tone] ?? "var(--p-accent)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">
                  {fmt(r.starts_on)} – {fmt(r.ends_on)}
                </div>
                <div className="s">
                  {r.hours_requested != null ? `${r.hours_requested}h` : ""}
                  {r.reason ? ` · ${r.reason}` : ""}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
                {r.request_state ?? "—"}
              </span>
            </div>
          );
        })
      )}

      <Link href="/m/time-off/new" className="fab" aria-label={t("m.timeOff.newCta", undefined, "Request Time Off")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
