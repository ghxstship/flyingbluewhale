import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { DownloadLink } from "@/components/DownloadLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buttonVariants } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProposalConvertButton } from "./ProposalConvertButton";
import { ProposalStatusControls } from "./ProposalStatusControls";
import { GenerateDraftButton } from "./GenerateDraftButton";

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
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, name")
    .eq("org_id", session.orgId)
    .eq("proposal_id", proposal.id)
    .is("deleted_at", null)
    .maybeSingle();

  // Latest AI-generated draft for this proposal (CV8). RLS scopes to org;
  // newest-first single row drives the inline preview below.
  const { data: latestDraft } = await supabase
    .from("ai_proposal_drafts")
    .select("id, draft_state, draft_content, created_at")
    .eq("org_id", session.orgId)
    .eq("proposal_id", proposal.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
            <Link
              href={`/console/proposals/${proposal.id}/edit`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("console.proposals.detail.editDocument", undefined, "Edit Document")}
            </Link>
            <Link
              href={`/console/documents/proposal?recordId=${proposal.id}`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("console.proposals.detail.openAsDocument", undefined, "Document")}
            </Link>
            <DownloadLink href={`/api/v1/proposals/${proposal.id}/pdf`}>
              {t("console.proposals.detail.downloadPdf", undefined, "PDF")}
            </DownloadLink>
            <GenerateDraftButton proposalId={proposal.id} />
            <ProposalStatusControls id={proposal.id} status={proposal.proposal_state} />
            {proposal.proposal_state === "signed" && !project && <ProposalConvertButton id={proposal.id} />}
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
          <Field label={t("console.proposals.detail.fields.proposal_state", undefined, "Status")}>
            <StatusBadge status={proposal.proposal_state} />
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
        <div className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">
              {t("console.proposals.detail.aiDraft", undefined, "AI Draft")}
            </h3>
            {latestDraft && <StatusBadge status={latestDraft.draft_state} />}
          </div>
          {latestDraft ? (
            <>
              <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
                {t("console.proposals.detail.aiDraftGenerated", undefined, "Generated")}{" "}
                {timeAgo(latestDraft.created_at)}
              </p>
              <p className="mt-3 text-sm whitespace-pre-wrap text-[var(--p-text-1)]">
                {latestDraft.draft_content}
              </p>
            </>
          ) : (
            <div className="mt-2">
              <EmptyState
                size="compact"
                title={t("console.proposals.detail.aiDraftEmptyTitle", undefined, "No draft yet")}
                description={t(
                  "console.proposals.detail.aiDraftEmptyDescription",
                  undefined,
                  "Use Generate Draft to have the assistant write a client-ready proposal from this scope.",
                )}
              />
            </div>
          )}
        </div>
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
