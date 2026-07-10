import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type WarrantyRow = {
  id: string;
  name: string;
  warranty_state: string;
  warrantor_name: string | null;
  end_date: string;
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return formatDateParts(new Date(value), { year: "numeric", month: "short", day: "numeric" });
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.assets.warranties.eyebrow", undefined, "Asset & Logistics")}
          title={t("console.assets.warranties.title", undefined, "Warranties")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.assets.warranties.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("warranties", session.orgId, {
    orderBy: "end_date",
    ascending: true,
    limit: 1000,
  })) as WarrantyRow[];

  // Reminder counts per warranty (warranty_reminders is org-scoped).
  const supabase = await createClient();
  const { data: reminderRows } = await supabase
    .from("warranty_reminders")
    .select("warranty_id")
    .eq("org_id", session.orgId)
    .limit(10000);
  const reminderCount = new Map<string, number>();
  for (const r of (reminderRows ?? []) as Array<{ warranty_id: string }>) {
    reminderCount.set(r.warranty_id, (reminderCount.get(r.warranty_id) ?? 0) + 1);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.warranties.eyebrow", undefined, "Asset & Logistics")}
        title={t("console.assets.warranties.title", undefined, "Warranties")}
        subtitle={t(
          "console.assets.warranties.subtitle",
          { count: rows.length },
          `${rows.length} warranties tracked`,
        )}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/assets" size="sm" variant="ghost">
              {t("console.assets.warranties.assetsLink", undefined, "Assets")}
            </Button>
            <Button href="/studio/assets/warranties/new" size="sm">
              {t("console.assets.warranties.newWarranty", undefined, "+ New warranty")}
            </Button>
          </div>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.assets.warranties.emptyTitle", undefined, "No warranties yet")}
            description={t(
              "console.assets.warranties.emptyDescription",
              undefined,
              "Track warrantor coverage, expiry dates, and reminder schedules for your equipment.",
            )}
            action={
              <Button href="/studio/assets/warranties/new" size="sm">
                {t("console.assets.warranties.newWarranty", undefined, "+ New warranty")}
              </Button>
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-start">{t("console.assets.warranties.columns.name", undefined, "Name")}</th>
                  <th className="text-start">{t("console.assets.warranties.columns.state", undefined, "State")}</th>
                  <th className="text-start">
                    {t("console.assets.warranties.columns.warrantor", undefined, "Warrantor")}
                  </th>
                  <th className="text-start">{t("console.assets.warranties.columns.end", undefined, "Expires")}</th>
                  <th className="text-end">
                    {t("console.assets.warranties.columns.reminders", undefined, "Reminders")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.name}</td>
                    <td>
                      <StatusBadge status={r.warranty_state} />
                    </td>
                    <td>{r.warrantor_name || "—"}</td>
                    <td className="font-mono text-xs">{fmtDate(r.end_date)}</td>
                    <td className="text-end font-mono">{reminderCount.get(r.id) ?? 0}</td>
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
