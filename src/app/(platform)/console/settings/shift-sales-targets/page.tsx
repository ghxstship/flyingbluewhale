import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ShiftSalesForm } from "./ShiftSalesForm";

export const dynamic = "force-dynamic";

type TargetRow = {
  id: string;
  shift_date: string;
  schedule_name: string | null;
  projected_revenue_cents: number;
  currency: string;
  notes: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.shiftSalesTargets.eyebrow", undefined, "Settings")}
          title={t("console.settings.shiftSalesTargets.title", undefined, "Shift Sales Targets")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.shiftSalesTargets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("shift_sales_targets")
    .select("id, shift_date, schedule_name, projected_revenue_cents, currency, notes")
    .eq("org_id", session.orgId)
    .gte("shift_date", new Date().toISOString().slice(0, 10))
    .order("shift_date")
    .limit(90);

  const rows = (data ?? []) as TargetRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.shiftSalesTargets.eyebrow", undefined, "Settings")}
        title={t("console.settings.shiftSalesTargets.title", undefined, "Shift Sales Targets")}
        subtitle={t(
          "console.settings.shiftSalesTargets.subtitle",
          undefined,
          "Set projected revenue per day so the Resource Forecast shows labor cost as a percentage of revenue.",
        )}
      />
      <div className="page-content space-y-6 max-w-2xl">
        <div className="surface p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
            {t("console.settings.shiftSalesTargets.addTarget", undefined, "Add Target")}
          </h2>
          <ShiftSalesForm orgId={session.orgId} />
        </div>

        {rows.length > 0 && (
          <div className="surface p-5">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {t("console.settings.shiftSalesTargets.upcoming", undefined, "Upcoming Targets")}
            </h2>
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.settings.shiftSalesTargets.columns.date", undefined, "Date")}</th>
                  <th>{t("console.settings.shiftSalesTargets.columns.schedule", undefined, "Schedule")}</th>
                  <th className="text-right">
                    {t("console.settings.shiftSalesTargets.columns.revenue", undefined, "Projected Revenue")}
                  </th>
                  <th>{t("console.settings.shiftSalesTargets.columns.notes", undefined, "Notes")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.shift_date}</td>
                    <td>{r.schedule_name ?? "—"}</td>
                    <td className="text-right font-mono text-xs">
                      {fmt.money(r.projected_revenue_cents, r.currency)}
                    </td>
                    <td className="text-xs text-[var(--p-text-2)]">{r.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
