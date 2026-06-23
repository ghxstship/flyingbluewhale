export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, fmtDate } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";
import { deleteVendor } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("vendors")
    .select("id, name, category, contact_email, contact_phone, coi_expires_at, notes, payout_account_id")
    .eq("org_id", session.orgId)
    .eq("id", vendorId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.procurement.vendors.detail.eyebrow", undefined, "Procurement")}
      title={(r) => r.name}
      subtitle={(r) => r.category}
      breadcrumbs={[
        { label: t("console.procurement.vendors.detail.breadcrumbs.procurement", undefined, "Procurement") },
        {
          label: t("console.procurement.vendors.detail.breadcrumbs.vendors", undefined, "Vendors"),
          href: "/studio/procurement/vendors",
        },
        { label: row?.name ?? t("console.procurement.vendors.detail.breadcrumbs.fallback", undefined, "Vendor") },
      ]}
      fields={
        row
          ? [
              {
                label: t("console.procurement.vendors.detail.fields.category", undefined, "Category"),
                value: row.category ?? "—",
              },
              {
                label: t("console.procurement.vendors.detail.fields.contactEmail", undefined, "Contact Email"),
                value: row.contact_email ?? "—",
              },
              {
                label: t("console.procurement.vendors.detail.fields.contactPhone", undefined, "Contact Phone"),
                value: row.contact_phone ?? "—",
              },
              {
                label: t("console.procurement.vendors.detail.fields.coiExpires", undefined, "COI expires"),
                value: fmtDate(row.coi_expires_at),
              },
              {
                label: t("console.procurement.vendors.detail.fields.stripePayout", undefined, "Stripe Payout"),
                value: row.payout_account_id
                  ? t("console.procurement.vendors.detail.stripePayout.connected", undefined, "Connected")
                  : t("console.procurement.vendors.detail.stripePayout.notConnected", undefined, "Not connected"),
              },
              {
                label: t("console.procurement.vendors.detail.fields.notes", undefined, "Notes"),
                value: row.notes ?? "—",
              },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/studio/procurement/vendors/${vendorId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteVendor.bind(null, vendorId)}
              confirm={t(
                "console.procurement.vendors.detail.deleteConfirm",
                { name: row.name },
                `Delete vendor "${row.name}"? You can undo this right after deleting.`,
              )}
              undo={{ table: "vendors", id: vendorId, redirectTo: "/studio/procurement/vendors" }}
            />
          </div>
        ) : undefined
      }
    />
  );
}
