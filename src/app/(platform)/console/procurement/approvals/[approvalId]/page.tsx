export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ApprovalActions } from "./ApprovalActions";

type ApprovalDetail = {
  id: string;
  entity_type: string;
  entity_id: string;
  approval_request_state: string;
  notes: string | null;
  reviewer_notes: string | null;
  threshold_amount_cents: number | null;
  resolved_at: string | null;
  created_at: string;
  requested_by_user: { id: string; email: string } | null;
  approver_user: { id: string; email: string } | null;
};

const STATE_TONE: Record<string, "warning" | "success" | "error" | "muted"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  withdrawn: "muted",
};

const ENTITY_LABEL: Record<string, string> = {
  purchase_order: "Purchase Order",
  requisition: "Requisition",
  expense: "Expense",
};

function fmtAmount(cents: number | null): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function Page({ params }: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await params;

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="Approval" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: raw } = await supabase
    .from("approval_requests")
    .select(
      "id, entity_type, entity_id, approval_request_state, notes, reviewer_notes, threshold_amount_cents, resolved_at, created_at, requested_by_user:requested_by(id, email), approver_user:approver_id(id, email)",
    )
    .eq("id", approvalId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!raw) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="Approval not found" />
        <div className="page-content">
          <div className="surface p-6 text-sm">This approval request was not found or you do not have access.</div>
        </div>
      </>
    );
  }

  const approval = raw as ApprovalDetail;
  const isPending = approval.approval_request_state === "pending";

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement · Approvals"
        title={ENTITY_LABEL[approval.entity_type] ?? approval.entity_type}
        breadcrumbs={[
          { label: "Procurement", href: "/console/procurement" },
          { label: "Approvals", href: "/console/procurement/approvals" },
          { label: "Review" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <div className="surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Badge tone={STATE_TONE[approval.approval_request_state] ?? "muted"}>
              {approval.approval_request_state.charAt(0).toUpperCase() + approval.approval_request_state.slice(1)}
            </Badge>
            <span className="text-sm text-[var(--color-text-muted)]">
              Submitted {new Date(approval.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-[var(--color-text-muted)]">Requested by</dt>
            <dd>{approval.requested_by_user?.email ?? "—"}</dd>

            <dt className="text-[var(--color-text-muted)]">Assigned approver</dt>
            <dd>{approval.approver_user?.email ?? "Unassigned"}</dd>

            <dt className="text-[var(--color-text-muted)]">Threshold amount</dt>
            <dd className="tabular-nums">{fmtAmount(approval.threshold_amount_cents)}</dd>

            {approval.resolved_at && (
              <>
                <dt className="text-[var(--color-text-muted)]">Resolved</dt>
                <dd>{new Date(approval.resolved_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</dd>
              </>
            )}
          </dl>

          {approval.notes && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Requester notes</p>
              <p className="text-sm">{approval.notes}</p>
            </div>
          )}

          {approval.reviewer_notes && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Reviewer notes</p>
              <p className="text-sm">{approval.reviewer_notes}</p>
            </div>
          )}

          {isPending && <ApprovalActions approvalId={approvalId} />}
        </div>
      </div>
    </>
  );
}
