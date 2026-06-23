export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";
import { deleteMileage } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ mileageId: string }> }) {
  const { mileageId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("mileage_logs")
    .select("id, origin, destination, miles, rate_cents, logged_on, notes, project_id, user_id")
    .eq("org_id", session.orgId)
    .eq("id", mileageId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
      title={(r) => `${r.origin} → ${r.destination}`}
      subtitle={(r) => `${r.miles} mi`}
      breadcrumbs={[
        { label: t("console.finance.breadcrumb", undefined, "Finance"), href: "/studio/finance" },
        { label: t("console.finance.mileage.breadcrumb", undefined, "Mileage"), href: "/studio/finance/mileage" },
        {
          label: row
            ? `${row.origin} → ${row.destination}`
            : t("console.finance.mileage.breadcrumb", undefined, "Mileage"),
        },
      ]}
      fields={
        row
          ? [
              { label: t("console.finance.mileage.detail.miles", undefined, "Miles"), value: `${row.miles}` },
              { label: t("console.finance.mileage.detail.rate", undefined, "Rate"), value: money(row.rate_cents) },
              {
                label: t("console.finance.mileage.detail.total", undefined, "Total"),
                value: money(Math.round(row.miles * row.rate_cents)),
              },
              {
                label: t("console.finance.mileage.detail.loggedOn", undefined, "Logged On"),
                value: fmtDate(row.logged_on),
              },
              { label: t("console.finance.mileage.detail.notes", undefined, "Notes"), value: row.notes ?? "—" },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/studio/finance/mileage/${mileageId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteMileage.bind(null, mileageId)}
              confirm={t(
                "console.finance.mileage.detail.deleteConfirm",
                undefined,
                "Delete this mileage log? This cannot be undone.",
              )}
            />
          </div>
        ) : undefined
      }
    />
  );
}
