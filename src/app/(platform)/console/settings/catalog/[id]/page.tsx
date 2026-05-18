import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toggleActive, deleteItem } from "./actions";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, description, unit_cost_cents, currency, inventory_qty, active, created_at")
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
    created_at: string;
  };

  // Roll-up: how many deliverables reference this catalog item.
  const { count: usageCount } = await supabase
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("catalog_item_id", item.id)
    .is("deleted_at", null);

  return (
    <>
      <ModuleHeader
        eyebrow="Catalog"
        title={item.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{item.kind}</Badge>
            <Badge variant={item.active ? "success" : "muted"}>{item.active ? "Active" : "Inactive"}</Badge>
            <span className="font-mono text-xs">{item.code}</span>
            <span className="font-mono text-xs">{usageCount ?? 0} assignments</span>
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href={`/console/settings/catalog/${item.id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </Link>
            <form action={toggleActive}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="next" value={item.active ? "false" : "true"} />
              <button type="submit" className="btn btn-secondary btn-sm">
                {item.active ? "Deactivate" : "Reactivate"}
              </button>
            </form>
            <DeleteForm
              action={deleteItem.bind(null, item.id)}
              confirm="Soft-delete this catalog item? Existing deliverable rows keep their catalog_item_id; new assignments can't pick it."
            />
          </div>
        }
      />
      <div className="page-content max-w-2xl space-y-3">
        {item.description && <section className="surface p-4 text-sm whitespace-pre-wrap">{item.description}</section>}
        <section className="surface grid grid-cols-2 gap-3 p-4 text-xs">
          <div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Unit Cost</div>
            <div className="mt-1 font-mono">
              {item.unit_cost_cents != null
                ? formatMoney(item.unit_cost_cents)
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Inventory</div>
            <div className="mt-1 font-mono">{item.inventory_qty ?? "—"}</div>
          </div>
        </section>
      </div>
    </>
  );
}
