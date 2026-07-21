import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { Fab } from "@/components/mobile/kit";
import { MileageView, type MileageItem } from "./MileageView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Mileage — the drives you've logged.
 *
 * Scoped to the viewer. RLS on `mileage_logs` is org-level, so it is no
 * backstop for a personal surface (same shape as D6/D16). A manager
 * reviewing the org's mileage does that on the console.
 *
 * Kit 34: the list renders through the shared view engine (`MileageView` →
 * `NormalizedList`, table default). The DB read below is unchanged.
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

  const items: MileageItem[] = rows.map((r) => {
    // The reimbursement is derived, never stored per-row from the form:
    // rate_cents is the column default, not the driver's input.
    const value = Math.round(Number(r.miles ?? 0) * Number(r.rate_cents ?? 0));
    return {
      id: r.id as string,
      origin: r.origin as string,
      destination: r.destination as string,
      route: `${r.origin as string} → ${r.destination as string}`,
      miles: Number(r.miles ?? 0),
      milesLabel: fmt.number(Number(r.miles ?? 0)),
      loggedIso: (r.logged_on as string | null) ?? null,
      dateLabel: fmt.date(r.logged_on as string),
      valueLabel: fmt.money(value),
      notes: (r.notes as string | null) ?? null,
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.mileage.eyebrow", { miles: fmt.number(totalMiles) }, `${fmt.number(totalMiles)} Miles Logged`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.mileage.title", undefined, "Mileage")}
      </h1>

      <MileageView items={items} />

      {/* Kit-29 spec: FAB = New Mileage. */}
      <Fab href="/m/mileage/new" label={t("m.mileage.newCta", undefined, "Log A Drive")} />
    </div>
  );
}
