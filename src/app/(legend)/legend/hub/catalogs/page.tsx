import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { DataViewSwitcher } from "@/components/views/DataViewSwitcher";
import { resolveDataView } from "@/components/views/resolveDataView";
import type { DataViewKind } from "@/components/views/DataViewKind";
import { CatalogGallery } from "./CatalogGallery";

// Catalog rows carry a name + kind + cost — a natural fit for a card
// gallery alongside the dense table. Default is table.
const CATALOG_VIEWS = ["table", "gallery"] as const satisfies readonly DataViewKind[];
type CatalogView = (typeof CATALOG_VIEWS)[number];

export const dynamic = "force-dynamic";

/**
 * Catalogs pillar (canonical home, decision 6 rider). The master catalog's
 * full CRUD surface — list, lens, gallery, new, detail, edit — lives here;
 * /studio/settings/catalog redirects in.
 */

type Row = {
  id: string;
  kind: string;
  code: string;
  name: string;
  unit_cost_cents: number | null;
  currency: string | null;
  inventory_qty: number | null;
  active: boolean;
  is_special_order: boolean;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  ticket: "Tickets",
  credential: "Credentials",
  catering: "Catering",
  radio: "Radios",
  tool: "Tools",
  equipment: "Equipment",
  uniform: "Uniforms",
  travel: "Travel",
  lodging: "Lodging",
  vehicle: "Vehicles",
};

// A special-order SKU is one the field (COMPVSS advance intake) minted for an
// item that wasn't in the catalog. It carries is_special_order and lands
// INACTIVE; "pending" = still awaiting a manager's approval into the catalog.
const isPendingSpecialOrder = (r: Row) => r.is_special_order && !r.active;

export default async function CatalogsPillarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string }>;
}) {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Catalogs" />
        <ConfigureSupabase />
      </>
    );
  }
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const sp = await searchParams;
  const view = resolveDataView<CatalogView>(sp, CATALOG_VIEWS, "table");
  const pendingLens = sp.filter === "pending";
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, unit_cost_cents, currency, inventory_qty, active, is_special_order, created_at")
    .limit(1000)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("kind")
    .order("name");
  const allRows = (data ?? []) as Row[];
  const pendingCount = allRows.filter(isPendingSpecialOrder).length;
  const rows = pendingLens ? allRows.filter(isPendingSpecialOrder) : allRows;

  // Lens links preserve the active view so switching lens doesn't reset it.
  const viewQs = view !== "table" ? `view=${view}` : "";
  const allHref = `/legend/hub/catalogs${viewQs ? `?${viewQs}` : ""}`;
  const pendingHref = `/legend/hub/catalogs?filter=pending${viewQs ? `&${viewQs}` : ""}`;

  const KIND_LABEL_I18N: Record<string, string> = {
    credential: t("console.settings.catalog.kind.credential", undefined, "Credentials"),
    catering: t("console.settings.catalog.kind.catering", undefined, "Catering"),
    radio: t("console.settings.catalog.kind.radio", undefined, "Radios"),
    tool: t("console.settings.catalog.kind.tool", undefined, "Tools"),
    equipment: t("console.settings.catalog.kind.equipment", undefined, "Equipment"),
    uniform: t("console.settings.catalog.kind.uniform", undefined, "Uniforms"),
    travel: t("console.settings.catalog.kind.travel", undefined, "Travel"),
    lodging: t("console.settings.catalog.kind.lodging", undefined, "Lodging"),
    vehicle: t("console.settings.catalog.kind.vehicle", undefined, "Vehicles"),
  };
  const itemWord =
    allRows.length === 1
      ? t("console.settings.catalog.itemSingular", undefined, "Item")
      : t("console.settings.catalog.itemPlural", undefined, "Items");

  const emptyTitle = pendingLens
    ? t("console.settings.catalog.pendingEmptyTitle", undefined, "No special orders waiting")
    : t("console.settings.catalog.emptyLabel", undefined, "No catalog items yet");
  const emptyDescription = pendingLens
    ? t(
        "console.settings.catalog.pendingEmptyDescription",
        undefined,
        "When a field crew requests an item that isn't in the catalog, it lands here for you to review and approve.",
      )
    : t(
        "console.settings.catalog.emptyDescription",
        undefined,
        "Define reusable credentials, uniforms, radios, vehicles, etc. so admins can pick from a dropdown when assigning to people.",
      );
  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title={t("console.settings.catalog.title", undefined, "Master Catalog")}
        subtitle={t(
          "console.settings.catalog.subtitle",
          { count: allRows.length, itemWord },
          `${allRows.length} ${itemWord} · the assignable inventory for advancing surfaces`,
        )}
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Catalogs" },
        ]}
        action={
          <div className="flex items-center gap-3">
            {/* Lens: All ↔ Pending Approval (special orders awaiting a manager). */}
            <div className="flex items-center gap-1" role="group" aria-label={t("console.settings.catalog.lensAria", undefined, "Catalog lens")}>
              <Link
                href={allHref}
                aria-current={pendingLens ? undefined : "page"}
                className={buttonVariants({ variant: pendingLens ? "ghost" : "soft", size: "sm" })}
              >
                {t("console.settings.catalog.lensAll", undefined, "All")}
              </Link>
              <Link
                href={pendingHref}
                aria-current={pendingLens ? "page" : undefined}
                className={buttonVariants({ variant: pendingLens ? "soft" : "ghost", size: "sm" })}
              >
                {t("console.settings.catalog.lensPending", { count: pendingCount }, "Pending Approval")}
                {pendingCount > 0 && (
                  <Badge variant="warning" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            </div>
            <DataViewSwitcher
              current={view}
              allowed={CATALOG_VIEWS}
              defaultView="table"
              ariaLabel={t("console.settings.catalog.viewSwitcherAria", undefined, "Catalog View")}
            />
            <Button href="/legend/signage" size="sm" variant="secondary">
              Signage library
            </Button>
            <Button href="/legend/hub/catalogs/new" size="sm">
              {t("console.settings.catalog.newItem", undefined, "+ New Item")}
            </Button>
          </div>
        }
      />
      <div className="page-content">
        {view === "gallery" ? (
          <CatalogGallery
            items={rows.map((r) => ({
              id: r.id,
              title: r.name,
              eyebrow: KIND_LABEL_I18N[r.kind] ?? KIND_LABEL[r.kind] ?? r.kind,
              subtitle: r.code,
              state: isPendingSpecialOrder(r) ? "pending" : r.active ? "active" : "inactive",
              href: `/legend/hub/catalogs/${r.id}`,
              unitCostCents: r.unit_cost_cents,
              currency: r.currency,
              inventoryQty: r.inventory_qty,
            }))}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        ) : (
          <DataTable<Row>
            rows={rows}
            rowHref={(r) => `/legend/hub/catalogs/${r.id}`}
            emptyLabel={emptyTitle}
            emptyDescription={emptyDescription}
            columns={[
              {
                key: "kind",
                header: t("console.settings.catalog.columns.kind", undefined, "Kind"),
                render: (r) => <Badge variant="muted">{KIND_LABEL_I18N[r.kind] ?? KIND_LABEL[r.kind] ?? r.kind}</Badge>,
              },
              {
                key: "code",
                header: t("console.settings.catalog.columns.code", undefined, "Code"),
                render: (r) => r.code,
                mono: true,
              },
              {
                key: "name",
                header: t("console.settings.catalog.columns.name", undefined, "Name"),
                render: (r) => r.name,
              },
              {
                key: "inventory_qty",
                header: t("console.settings.catalog.columns.inv", undefined, "Inv"),
                render: (r) => r.inventory_qty ?? "—",
                mono: true,
              },
              {
                key: "unit_cost_cents",
                header: t("console.settings.catalog.columns.unit", undefined, "Unit"),
                render: (r) => (r.unit_cost_cents != null ? fmt.money(r.unit_cost_cents, r.currency ?? "USD") : "—"),
                mono: true,
              },
              {
                key: "active",
                header: t("console.settings.catalog.columns.status", undefined, "Status"),
                render: (r) =>
                  isPendingSpecialOrder(r) ? (
                    <Badge variant="warning">
                      {t("console.settings.catalog.statusPending", undefined, "Pending Approval")}
                    </Badge>
                  ) : r.active ? (
                    <Badge variant="success">{t("console.settings.catalog.statusActive", undefined, "Active")}</Badge>
                  ) : (
                    <Badge variant="muted">{t("console.settings.catalog.statusInactive", undefined, "Inactive")}</Badge>
                  ),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
