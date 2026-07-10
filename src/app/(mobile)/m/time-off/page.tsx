import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { TimeOffList, type TimeOffItem } from "./TimeOffList";

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
  const i18nFmt = await getRequestFormatters();

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
      <TimeOffList
        items={requests.map((r): TimeOffItem => {
          const tone = STATE_TONE[r.request_state ?? ""] ?? "neutral";
          const fmt = (d: string | null) =>
            d ? i18nFmt.dateParts(new Date(d + "T00:00:00"), { month: "short", day: "numeric" }) : "—";
          return {
            id: r.id,
            range: `${fmt(r.starts_on)} to ${fmt(r.ends_on)}`,
            meta: `${r.hours_requested != null ? `${r.hours_requested}h` : ""}${r.reason ? ` · ${r.reason}` : ""}`,
            state: r.request_state ?? "—",
            tone,
            barColor: TONE_VAR[tone] ?? "var(--p-accent)",
            sortAt: r.starts_on ?? "",
          };
        })}
      />

      <Link href="/m/time-off/new" className="fab" aria-label={t("m.timeOff.newCta", undefined, "Request Time Off")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
