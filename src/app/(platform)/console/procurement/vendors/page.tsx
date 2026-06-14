import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Vendor } from "@/lib/supabase/types";
import { bulkDeleteVendors } from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.procurement.vendors.title", undefined, "Vendors")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.vendors.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const allRows = await listOrgScoped("vendors", session.orgId, { orderBy: "name", ascending: true });
  // `vendors` isn't in SOFT_DELETABLE_TABLES, so listOrgScoped doesn't
  // auto-filter — hide soft-deleted rows here (the DB has `deleted_at`;
  // it predates the typed Vendor row, so read it off the loose shape).
  const rows = allRows.filter((r) => (r as Vendor & { deleted_at?: string | null }).deleted_at == null);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.vendors.title", undefined, "Vendors")}
        subtitle={
          rows.length === 1
            ? t("console.procurement.vendors.subtitleOne", { count: rows.length }, `${rows.length} Vendor`)
            : t("console.procurement.vendors.subtitleOther", { count: rows.length }, `${rows.length} Vendors`)
        }
        action={
          <Button href="/console/procurement/vendors/new">
            {t("console.procurement.vendors.newVendor", undefined, "+ New Vendor")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Vendor>
          rows={rows}
          rowHref={(r) => `/console/procurement/vendors/${r.id}`}
          emptyLabel={t("console.procurement.vendors.emptyLabel", undefined, "No vendors yet")}
          emptyDescription={t(
            "console.procurement.vendors.emptyDescription",
            undefined,
            "Onboard suppliers with W-9, COI, and payment terms before issuing POs.",
          )}
          emptyAction={
            <Button href="/console/procurement/vendors/new" size="sm">
              {t("console.procurement.vendors.newVendor", undefined, "+ New Vendor")}
            </Button>
          }
          bulkActions={[
            {
              id: "delete",
              label: t("console.procurement.vendors.bulk.delete", undefined, "Delete"),
              variant: "danger",
              perform: bulkDeleteVendors,
            },
          ]}
          columns={[
            {
              key: "name",
              header: t("console.procurement.vendors.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "category",
              header: t("console.procurement.vendors.columns.category", undefined, "Category"),
              render: (r) => r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: t("console.procurement.vendors.columns.email", undefined, "Email"),
              render: (r) => r.contact_email ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.contact_email ?? null,
            },
            {
              key: "w9",
              header: t("console.procurement.vendors.columns.w9", undefined, "W-9"),
              render: (r) =>
                r.w9_on_file ? (
                  <Badge variant="success">{t("console.procurement.vendors.w9.onFile", undefined, "On File")}</Badge>
                ) : (
                  <Badge variant="warning">{t("console.procurement.vendors.w9.missing", undefined, "Missing")}</Badge>
                ),
              accessor: (r) => r.w9_on_file ?? null,
            },
            {
              key: "coi",
              header: t("console.procurement.vendors.columns.coiExpires", undefined, "COI expires"),
              render: (r) => formatDate(r.coi_expires_at, "medium"),
              className: "font-mono text-xs",
              accessor: (r) => r.coi_expires_at,
            },
          ]}
        />
      </div>
    </>
  );
}
