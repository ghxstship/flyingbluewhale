import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Mileage — the drives you've logged.
 *
 * Scoped to the viewer. RLS on `mileage_logs` is org-level, so it is no
 * backstop for a personal surface (same shape as D6/D16). A manager
 * reviewing the org's mileage does that on the console.
 */
export default async function MileagePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("mileage_logs")
    .select("id, origin, destination, miles, rate_cents, logged_on, notes")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("logged_on", { ascending: false })
    .limit(50);

  const rows = data ?? [];
  const totalMiles = rows.reduce((sum, r) => sum + Number(r.miles ?? 0), 0);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.mileage.eyebrow", { miles: fmt.number(totalMiles) }, `${fmt.number(totalMiles)} Miles Logged`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.mileage.title", undefined, "Mileage")}
      </h1>

      <Link
        href="/m/mileage/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 12, textDecoration: "none" }}
      >
        <KIcon name="Plus" size={16} /> {t("m.mileage.new", undefined, "Log A Drive")}
      </Link>

      {rows.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.mileage.emptyTitle", undefined, "No Drives Logged")}
          description={t(
            "m.mileage.emptyBody",
            undefined,
            "Log a trip while you remember it. Your manager approves it later.",
          )}
        />
      ) : (
        rows.map((r) => {
          // The reimbursement is derived, never stored per-row from the
          // form: rate_cents is the column default, not the driver's input.
          const value = Math.round(Number(r.miles ?? 0) * Number(r.rate_cents ?? 0));
          return (
            <div className="item" key={r.id as string} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <KIcon name="Truck" size={18} style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">
                    {r.origin as string} → {r.destination as string}
                  </div>
                  <div className="s">
                    {fmt.number(Number(r.miles))} mi · {fmt.date(r.logged_on as string)}
                  </div>
                </div>
                <span className="ps-badge ps-badge--neutral">{fmt.money(value)}</span>
              </div>
              {r.notes ? (
                <p className="form-intro" style={{ margin: "8px 0 0" }}>
                  {r.notes as string}
                </p>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
