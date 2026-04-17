import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, timeAgo } from "@/lib/format";
import { PoStatusControls } from "./PoStatusControls";

export const dynamic = "force-dynamic";

export default async function POPage({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const po = await getOrgScoped("purchase_orders", session.orgId, poId);
  if (!po) notFound();
  return (
    <>
      <ModuleHeader
        eyebrow={po.number}
        title={po.title}
        subtitle={`${formatMoney(po.amount_cents, po.currency)} · ${po.status}`}
        action={<PoStatusControls id={po.id} status={po.status} />}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Status"><StatusBadge status={po.status} /></Field>
          <Field label="Amount">{formatMoney(po.amount_cents, po.currency)}</Field>
          <Field label="Created">{timeAgo(po.created_at)}</Field>
          <Field label="Updated">{timeAgo(po.updated_at)}</Field>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface-raised p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm font-mono">{children}</div>
    </div>
  );
}
