import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { resolveProposalContext, getApproval } from "@/lib/proposals/portal/queries";
import { APPROVAL_STATE_LABEL, APPROVAL_STATE_VARIANT } from "@/lib/proposals/portal/types";
import { timeAgo } from "@/lib/format";
import { ApprovalSignBlock } from "./ApprovalSignBlock";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; proposalId: string; approvalId: string }>;
}) {
  const { slug, proposalId, approvalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const approval = await getApproval(approvalId);
  if (!approval || approval.proposal_id !== proposalId) notFound();
  const base = `/p/${slug}/client/proposals/${proposalId}/approvals`;
  const { t } = await getRequestT();

  return (
    <div className="space-y-4 p-6">
      <Link href={base} className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
        {t("p.client.proposals.approvals.detail.backLink", undefined, "← All approvals")}
      </Link>

      <header className="surface p-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
            {toTitle(approval.kind)}
          </span>
          <Badge variant={APPROVAL_STATE_VARIANT[approval.state]}>{APPROVAL_STATE_LABEL[approval.state]}</Badge>
        </div>
        <h1 className="mt-2 text-xl font-semibold">{approval.title}</h1>
        {approval.body && <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{approval.body}</p>}
      </header>

      {approval.state === "signed" && (
        <Alert kind="success" title={t("p.client.proposals.approvals.detail.signed.title", undefined, "Signed")}>
          {t(
            "p.client.proposals.approvals.detail.signed.body",
            { label: approval.signed_label ?? "—", ago: timeAgo(approval.signed_at!) },
            `Counter-signed by ${approval.signed_label ?? "—"} ${timeAgo(approval.signed_at!)}.`,
          )}
        </Alert>
      )}
      {approval.state === "declined" && (
        <Alert kind="error" title={t("p.client.proposals.approvals.detail.declined.title", undefined, "Declined")}>
          {approval.decline_reason ??
            t("p.client.proposals.approvals.detail.declined.noReason", undefined, "No reason provided.")}
        </Alert>
      )}

      {approval.state === "pending" && (
        <ApprovalSignBlock slug={slug} proposalId={proposalId} approvalId={approvalId} />
      )}
    </div>
  );
}
