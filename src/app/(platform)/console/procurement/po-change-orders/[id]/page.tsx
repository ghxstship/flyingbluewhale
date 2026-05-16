import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/i18n/format";;
import { transitionPoChangeOrder } from "./actions";
import { StatusForm } from "@/components/StatusForm";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "error"> = {
  proposed: "muted",
  submitted: "info",
  in_review: "info",
  approved: "success",
  rejected: "error",
  void: "muted",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: co } = await supabase
    .from("po_change_orders")
    .select("*, purchase_order:purchase_order_id(number, title, vendor:vendor_id(name)), project:project_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!co) notFound();

  const po = co.purchase_order as unknown as {
    number: string;
    title: string | null;
    vendor: { name: string } | null;
  } | null;

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        breadcrumbs={[
          { label: "PO Change Orders", href: "/console/procurement/po-change-orders" },
          { label: `CO-${co.number}` },
        ]}
        title={`CO #${co.number} — ${co.title}`}
        subtitle={`${po?.number ?? "—"} · ${po?.vendor?.name ?? ""}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[co.status] ?? "muted"}>{co.status.replace("_", " ")}</Badge>
            {co.status === "proposed" && (
              <StatusForm action={transitionPoChangeOrder.bind(null, id, "submitted")} label="Submit" />
            )}
            {(co.status === "submitted" || co.status === "in_review") && (
              <>
                <StatusForm action={transitionPoChangeOrder.bind(null, id, "approved")} label="Approve" />
                <StatusForm action={transitionPoChangeOrder.bind(null, id, "rejected")} label="Reject" />
              </>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-3 md:grid-cols-3">
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Amount</div>
            <div className="text-lg font-semibold">{formatMoney(co.amount_cents)}</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Schedule impact</div>
            <div className="text-lg font-semibold">{co.schedule_impact_days} days</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Proposed</div>
            <div className="text-lg font-semibold">{formatDate(co.proposed_at, "short")}</div>
          </div>
        </section>
        {co.reason && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Reason</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap">{co.reason}</p>
          </section>
        )}
        <ConversationPanel orgId={session.orgId} recordType="po_change_order" recordId={id} />
      </div>
    </>
  );
}
