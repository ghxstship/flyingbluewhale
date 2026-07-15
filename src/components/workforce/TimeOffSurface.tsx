import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { PortalHref } from "./shell-contract";

/**
 * Shared time-off balances + recent-requests surface (ADR-0008 Move 1,
 * Amendment 4).
 *
 * Same query + render across COMPVSS (`/m/time-off`) and the portal
 * crew/vendor personas. `newRequestHref` routes the "New Request" CTA to
 * each shell's own form — on the portal arm it is a `PortalHref`, so the
 * old `/m/time-off/new` deep link is now a compile error rather than a
 * comment promising it'll be lifted "in a future PR".
 */

type RequestRow = {
  id: string;
  policy_id: string;
  starts_on: string;
  ends_on: string;
  hours_requested: number;
  request_state: string;
  decision_note: string | null;
  created_at: string;
};

type BalanceRow = {
  policy_id: string;
  balance_hours: number;
  accrued_ytd_hours: number;
  used_ytd_hours: number;
  year: number;
};

type PolicyRow = { id: string; name: string; policy_kind: string };

type TimeOffProps = {
  eyebrowLabel?: string;
  titleLabel?: string;
} & ({ variant: "mobile"; newRequestHref: string } | { variant: "portal"; newRequestHref: PortalHref });

export async function TimeOffSurface({ variant, newRequestHref, eyebrowLabel, titleLabel }: TimeOffProps) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const year = new Date().getFullYear();

  const [{ data: requests }, { data: balances }, { data: policies }] = await Promise.all([
    supabase
      .from("time_off_requests")
      .select("id, policy_id, starts_on, ends_on, hours_requested, request_state, decision_note, created_at")
      .eq("user_id", session.userId)
      .order("starts_on", { ascending: false })
      .limit(50),
    supabase
      .from("time_off_balances")
      .select("policy_id, balance_hours, accrued_ytd_hours, used_ytd_hours, year")
      .eq("user_id", session.userId)
      .eq("year", year),
    supabase
      .from("time_off_policies")
      .select("id, name, policy_kind")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const policyMap = new Map(((policies ?? []) as PolicyRow[]).map((p) => [p.id, p]));
  const balanceList = (balances ?? []) as BalanceRow[];
  const requestList = (requests ?? []) as RequestRow[];

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";
  const eyebrow = eyebrowLabel ?? (variant === "mobile" ? t("m.common.eyebrow", undefined, "Mobile") : "Crew");
  const title = titleLabel ?? t("m.timeOff.title", undefined, "Time Off");

  return (
    <div className={containerClass}>
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">{eyebrow}</div>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>

      <section className="mt-5">
        <h2 className="text-sm font-semibold">{t("m.timeOff.balancesHeading", { year }, `Balances (${year})`)}</h2>
        {balanceList.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--p-text-2)]">
            {t("m.timeOff.noPolicies", undefined, "No policies assigned yet.")}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {balanceList.map((b) => {
              const policy = policyMap.get(b.policy_id);
              return (
                <li key={b.policy_id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {policy?.name ?? t("m.timeOff.policyFallback", undefined, "Policy")}
                    </div>
                    <div className="font-mono text-xs text-[var(--p-text-2)]">
                      {t(
                        "m.timeOff.accruedUsed",
                        { accrued: b.accrued_ytd_hours, used: b.used_ytd_hours },
                        `Accrued ${b.accrued_ytd_hours}h / Used ${b.used_ytd_hours}h`,
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-semibold">
                      {t("m.timeOff.hours", { hours: b.balance_hours }, `${b.balance_hours}h`)}
                    </div>
                    <div className="text-[11px] text-[var(--p-text-2)]">
                      {t("m.timeOff.available", undefined, "available")}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-5 flex justify-end">
        <Link href={newRequestHref} className="ps-btn ps-btn--sm">
          {t("m.timeOff.newRequest", undefined, "New Request")}
        </Link>
      </div>

      <section className="mt-5">
        <h2 className="text-sm font-semibold">{t("m.timeOff.recentRequests", undefined, "Recent Requests")}</h2>
        <ul className="mt-2 space-y-2">
          {requestList.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title={t("m.timeOff.empty.title", undefined, "No Requests")}
                description={t("m.timeOff.empty.description", undefined, "Your time-off requests will appear here.")}
              />
            </li>
          ) : (
            requestList.map((r) => {
              const policy = policyMap.get(r.policy_id);
              const tone =
                r.request_state === "approved"
                  ? "success"
                  : r.request_state === "denied"
                    ? "error"
                    : r.request_state === "cancelled"
                      ? "muted"
                      : "info";
              return (
                <li key={r.id} className="surface p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={tone}>{r.request_state}</Badge>
                    <span className="font-mono text-xs text-[var(--p-text-2)]">
                      {t("m.timeOff.hours", { hours: r.hours_requested }, `${r.hours_requested}h`)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {policy?.name ?? t("m.timeOff.timeOffFallback", undefined, "Time off")}
                  </div>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">
                    {fmt.date(r.starts_on)} → {fmt.date(r.ends_on)}
                  </div>
                  {r.decision_note && <p className="mt-1 text-xs text-[var(--p-text-2)]">{r.decision_note}</p>}
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
