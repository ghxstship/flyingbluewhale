import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { toTitle } from "@/lib/format";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { toggleActive, deleteItem } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Master-catalog item detail (canonical home, decision 6 rider). Moved from
 * /studio/settings/catalog/[id] — approval, toggle, GTIN provenance, delete.
 */
export default async function CatalogItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Catalog Item" />
        <ConfigureSupabase />
      </>
    );
  }
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, description, unit_cost_cents, currency, inventory_qty, active, is_special_order, created_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const item = data as {
    id: string;
    kind: string;
    code: string;
    name: string;
    description: string | null;
    unit_cost_cents: number | null;
    currency: string | null;
    inventory_qty: number | null;
    active: boolean;
    is_special_order: boolean;
    created_at: string;
  };

  // A field-minted special order (is_special_order) that's still inactive is
  // awaiting a manager's approval into the standard catalog.
  const isPendingSpecialOrder = item.is_special_order && !item.active;

  // Roll-up: how many active assignments reference this catalog item.
  const { count: usageCount } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("catalog_item_id", item.id)
    .is("deleted_at", null);

  // GTIN bindings — the barcodes the field's scan-to-fulfil flow bound to this
  // SKU, with their provenance (who bound them, when). Written by the check-in
  // binder; this is where they read.
  const { data: gtinRows } = await supabase
    .from("catalog_item_gtins")
    .select("gtin14, bound_at, bound_by")
    .eq("org_id", session.orgId)
    .eq("catalog_item_id", item.id)
    .order("bound_at", { ascending: false })
    .limit(20);
  const gtins = (gtinRows ?? []) as { gtin14: string; bound_at: string; bound_by: string | null }[];
  const binderIds = [...new Set(gtins.map((g) => g.bound_by).filter(Boolean))] as string[];
  const binderName = new Map<string, string>();
  if (binderIds.length) {
    const { data: binders } = await supabase
      // soft-delete-exempt: resolving binder names by id — a since-offboarded user must still be named on the binding
      .from("users")
      .select("id, name, email")
      .in("id", binderIds);
    for (const u of (binders ?? []) as { id: string; name: string | null; email: string | null }[]) {
      binderName.set(u.id, u.name || u.email || "Member");
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title={item.name}
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Catalogs", href: "/legend/hub/catalogs" },
          { label: item.name },
        ]}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{toTitle(item.kind)}</Badge>
            <Badge variant={isPendingSpecialOrder ? "warning" : item.active ? "success" : "muted"}>
              {isPendingSpecialOrder
                ? t("console.settings.catalog.detail.statusPending", undefined, "Pending Approval")
                : item.active
                  ? t("console.settings.catalog.detail.statusActive", undefined, "Active")
                  : t("console.settings.catalog.detail.statusInactive", undefined, "Inactive")}
            </Badge>
            <span className="font-mono text-xs">{item.code}</span>
            <span className="font-mono text-xs">
              {t(
                "console.settings.catalog.detail.assignmentsCount",
                { count: usageCount ?? 0 },
                `${usageCount ?? 0} assignments`,
              )}
            </span>
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/legend/hub/catalogs/${item.id}/edit`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("common.edit", undefined, "Edit")}
            </Link>
            <form action={toggleActive}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="next" value={item.active ? "false" : "true"} />
              <button
                type="submit"
                className={
                  isPendingSpecialOrder ? "ps-btn ps-btn--cta ps-btn--sm" : "ps-btn ps-btn--ghost ps-btn--sm"
                }
              >
                {isPendingSpecialOrder
                  ? t("console.settings.catalog.detail.approve", undefined, "Approve")
                  : item.active
                    ? t("console.settings.catalog.detail.deactivate", undefined, "Deactivate")
                    : t("console.settings.catalog.detail.reactivate", undefined, "Reactivate")}
              </button>
            </form>
            <DeleteForm
              action={deleteItem.bind(null, item.id)}
              confirm={t(
                "console.settings.catalog.detail.deleteConfirm",
                undefined,
                "Remove this catalog item? Existing assignments keep their link to it for history; new assignments won't be able to pick it.",
              )}
              undo={{ table: "master_catalog_items", id: item.id, redirectTo: "/legend/hub/catalogs" }}
            />
          </div>
        }
      />
      <div className="page-content max-w-2xl space-y-3">
        {isPendingSpecialOrder && (
          <section className="ps-alert ps-alert--warning text-sm">
            {t(
              "console.settings.catalog.detail.pendingNote",
              undefined,
              "A field crew requested this as a special order because it wasn't in the catalog. Approve it to add it to the standard catalog and make it pickable, or remove it if it shouldn't be stocked.",
            )}
          </section>
        )}
        {item.description && <section className="surface p-4 text-sm whitespace-pre-wrap">{item.description}</section>}
        <section className="surface grid grid-cols-2 gap-3 p-4 text-xs">
          <div>
            <div className="eyebrow">
              {t("console.settings.catalog.detail.unitCost", undefined, "Unit Cost")}
            </div>
            <div className="mt-1 font-mono">
              {item.unit_cost_cents != null ? fmt.money(item.unit_cost_cents, item.currency ?? "USD") : "—"}
            </div>
          </div>
          <div>
            <div className="eyebrow">
              {t("console.settings.catalog.detail.inventory", undefined, "Inventory")}
            </div>
            <div className="mt-1 font-mono">{item.inventory_qty ?? "—"}</div>
          </div>
        </section>
        {gtins.length > 0 && (
          <section className="surface p-4 text-xs">
            <div className="eyebrow">
              {t("console.settings.catalog.detail.gtins", undefined, "Bound Barcodes (GTIN)")}
            </div>
            <ul className="mt-2 space-y-1">
              {gtins.map((g) => (
                <li key={g.gtin14} className="flex items-center justify-between gap-3">
                  <span className="font-mono">{g.gtin14}</span>
                  <span className="text-[var(--p-text-3)]">
                    {t(
                      "console.settings.catalog.detail.boundBy",
                      { date: fmt.date(g.bound_at), name: g.bound_by ? (binderName.get(g.bound_by) ?? "—") : "—" },
                      `${fmt.date(g.bound_at)} · ${g.bound_by ? (binderName.get(g.bound_by) ?? "—") : "—"}`,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
