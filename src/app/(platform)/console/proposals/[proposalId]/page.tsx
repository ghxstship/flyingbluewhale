import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { ProposalConvertButton } from "./ProposalConvertButton";
import { ProposalStatusControls } from "./ProposalStatusControls";

export const dynamic = "force-dynamic";

export default async function ProposalDetail({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const proposal = await getOrgScoped("proposals", session.orgId, proposalId);
  if (!proposal) notFound();
  const { t } = await getRequestT();

  // Resolve the linked project (if any) so the header can swap the
  // Convert button for a View Project link once conversion has run.
  // Queried via the reverse FK so we surface the project that explicitly
  // cites this proposal — not just any project the proposal happens to
  // be attached to.
  const supabase = await createClient();
  const { data: linkedProject } = await supabase
    .from("projects")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("id, slug, name" as any)
    .eq("org_id", session.orgId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("proposal_id" as any, proposal.id)
    .is("deleted_at", null)
    .maybeSingle();
  const project = linkedProject as { id: string; slug: string; name: string } | null;

  return (
    <>
      <ModuleHeader
        eyebrow={`${t("console.proposals.detail.eyebrow", undefined, "Proposal")} · ${proposal.doc_number ?? proposal.id.slice(0, 8)}`}
        title={proposal.title}
        subtitle={`${formatMoney(proposal.amount_cents ?? 0)} · v${proposal.version} · ${t("console.proposals.detail.createdPrefix", undefined, "created")} ${timeAgo(proposal.created_at)}`}
        breadcrumbs={[
          { label: t("console.proposals.detail.breadcrumb.revenue", undefined, "Revenue"), href: "/console/proposals" },
          {
            label: t("console.proposals.detail.breadcrumb.proposals", undefined, "Proposals"),
            href: "/console/proposals",
          },
          { label: proposal.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/console/proposals/${proposal.id}/edit`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("console.proposals.detail.editDocument", undefined, "Edit Document")}
            </Link>
            <ProposalStatusControls id={proposal.id} status={proposal.status} />
            {proposal.status === "signed" && !project && <ProposalConvertButton id={proposal.id} />}
            {project && (
              <Link href={`/console/projects/${project.id}`} className="ps-btn ps-btn--sm">
                {t("console.proposals.detail.viewProject", undefined, "View Project")}
              </Link>
            )}
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.proposals.detail.fields.status", undefined, "Status")}>
            <StatusBadge status={proposal.status} />
          </Field>
          <Field label={t("console.proposals.detail.fields.amount", undefined, "Amount")}>
            {formatMoney(proposal.amount_cents ?? 0)}
          </Field>
          <Field label={t("console.proposals.detail.fields.sent", undefined, "Sent")}>
            {proposal.sent_at ? timeAgo(proposal.sent_at) : "—"}
          </Field>
          <Field label={t("console.proposals.detail.fields.signed", undefined, "Signed")}>
            {proposal.signed_at ? timeAgo(proposal.signed_at) : "—"}
          </Field>
        </div>
        {proposal.notes && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">{t("console.proposals.detail.scope", undefined, "Scope")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{proposal.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
