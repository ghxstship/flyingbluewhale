import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { addChecklistItem, completeChecklistItem, skipChecklistItem } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

const STATUS_TONE: Record<string, "muted" | "success"> = {
  pending: "muted",
  complete: "success",
  skipped: "muted",
};

export default async function Page({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("number, title, vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", poId)
    .maybeSingle();
  if (!po) notFound();

  const { data: items } = await supabase
    .from("po_checklist_items")
    .select("*")
    .eq("purchase_order_id", poId)
    .order("position");

  const all = items ?? [];
  const done = all.filter((i) => i.status !== "pending").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        breadcrumbs={[
          { label: "Purchase Orders", href: "/console/procurement/purchase-orders" },
          { label: po.number, href: `/console/procurement/purchase-orders/${poId}` },
          { label: "Checklist" },
        ]}
        title={`PO ${po.number} — checklist`}
        subtitle={`${done} / ${all.length} steps complete · ${(po.vendor as unknown as { name: string | null } | null)?.name ?? "—"}`}
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Required steps</h3>
          {all.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No checklist items yet. Add the first below.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {all.map((it) => (
                <li key={it.id} className="surface-inset p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex-1">
                      {it.position + 1}. {it.prompt}
                    </span>
                    <Badge variant={STATUS_TONE[it.status] ?? "muted"}>{it.status}</Badge>
                  </div>
                  {it.status === "pending" && (
                    <div className="mt-2 flex gap-1.5">
                      <form action={completeChecklistItem.bind(null, poId, it.id)}>
                        <button
                          type="submit"
                          className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-[11px]"
                        >
                          Mark complete
                        </button>
                      </form>
                      <form action={skipChecklistItem.bind(null, poId, it.id)}>
                        <button
                          type="submit"
                          className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-[11px]"
                        >
                          Skip
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Add step</h3>
          <form action={addChecklistItem.bind(null, poId)} className="mt-3 space-y-2">
            <input name="prompt" required placeholder="Step description" className={INPUT} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="requires_photo" value="1" /> Requires photo proof
            </label>
            <div className="flex justify-end">
              <button type="submit" className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium">
                Add step
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
