import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, timeAgo } from "@/lib/format";
import { LeadStageMover } from "./LeadStageMover";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const lead = await getOrgScoped("leads", session.orgId, leadId);
  if (!lead) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow="Lead"
        title={lead.name}
        subtitle={lead.email ?? "No email"}
        action={<LeadStageMover leadId={lead.id} stage={lead.stage} />}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Stage"><StatusBadge status={lead.stage} /></Field>
          <Field label="Value">{formatMoney(lead.estimated_value_cents)}</Field>
          <Field label="Source">{lead.source ?? "—"}</Field>
          <Field label="Updated">{timeAgo(lead.updated_at)}</Field>
        </div>
        {lead.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{lead.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface-raised p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
