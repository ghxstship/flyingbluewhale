import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScopedWithCount } from "@/lib/db/resource";
import { fetchLookupOptions, fetchLookupLabelMap } from "@/lib/enum-lookup";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Vendor } from "@/lib/supabase/types";
import { bulkDeleteVendors } from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
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
  const sp = await searchParams;
  // Category is lookup-backed (ref_vendor_category). Facet options carry the
  // FULL domain incl. inactive (historical rows stay findable); the list column
  // renders the display_label off the stored `category_code`.
  const [categoryOptions, categoryLabels] = await Promise.all([
    fetchLookupOptions("ref_vendor_category", { includeInactive: true }),
    fetchLookupLabelMap("ref_vendor_category"),
  ]);
  // Newest-first (the listOrgScoped default): a name-asc sort + the 100-row cap
  // buries a just-created vendor past the loaded set. The DataTable is still
  // client-sortable by name, so alphabetical browsing is one click away.
  // Exact count alongside the capped window (F-01) — `vendors` is in
  // SOFT_DELETABLE_TABLES, so both the rows and the count exclude archived.
  const { rows, totalCount } = await listOrgScopedWithCount("vendors", session.orgId, {
    filters: sp.category ? [{ column: "category_code", op: "eq", value: sp.category }] : undefined,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.vendors.title", undefined, "Vendors")}
        subtitle={
          totalCount === 1
            ? t("console.procurement.vendors.subtitleOne", { count: totalCount }, `${totalCount} Vendor`)
            : t("console.procurement.vendors.subtitleOther", { count: totalCount }, `${totalCount} Vendors`)
        }
        action={
          <Button href="/studio/procurement/vendors/new">
            {t("console.procurement.vendors.newVendor", undefined, "+ New Vendor")}
          </Button>
        }
      />
      <div className="page-content">
        <FilterBar
          facets={[
            {
              param: "category",
              label: t("console.procurement.vendors.columns.category", undefined, "Category"),
              options: categoryOptions,
              allLabel: t("console.procurement.vendors.filter.allCategories", undefined, "All categories"),
            },
          ]}
          resultCount={totalCount}
        />
        <DataTable<Vendor>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/procurement/vendors/${r.id}`}
          emptyLabel={t("console.procurement.vendors.emptyLabel", undefined, "No vendors yet")}
          emptyDescription={t(
            "console.procurement.vendors.emptyDescription",
            undefined,
            "Onboard suppliers with W-9, COI, and payment terms before issuing POs.",
          )}
          emptyAction={
            <Button href="/studio/procurement/vendors/new" size="sm">
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
              // Render the lookup display_label off `category_code`, falling back
              // to the legacy text for any not-yet-migrated row. Filtering is the
              // lookup-driven FilterBar above; grouping keys on the label.
              render: (r) => categoryLabels[r.category_code ?? ""] ?? "—",
              accessor: (r) => categoryLabels[r.category_code ?? ""] ?? null,
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
