import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { resolveProposalContext, getChangeOrder } from "@/lib/proposals/portal/queries";
import { CO_STATE_LABEL, CO_STATE_VARIANT } from "@/lib/proposals/portal/types";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { ChangeOrderDecision } from "./ChangeOrderDecision";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; proposalId: string; coId: string }>;
}) {
  const { slug, proposalId, coId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const co = await getChangeOrder(coId);
  if (!co || co.proposal_id !== proposalId) notFound();
  const { t } = await getRequestT();
  const base = `/p/${slug}/client/proposals/${proposalId}/change-orders`;
  const decidable = co.state === "priced" || co.state === "client_review";

  return (
    <div className="space-y-4 p-6">
      <Link href={base} className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
        {t("p.client.changeOrderDetail.backLink", undefined, "← All change orders")}
      </Link>

      <header className="surface p-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-[var(--p-text-2)]">#{co.number}</span>
          <Badge variant={CO_STATE_VARIANT[co.state]}>{CO_STATE_LABEL[co.state]}</Badge>
        </div>
        <h1 className="mt-2 text-xl font-semibold">{co.title}</h1>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-[var(--p-border)] p-3">
            <div className="eyebrow text-xs text-[var(--p-text-2)]">
              {t("p.client.changeOrderDetail.costDelta", undefined, "Cost delta")}
            </div>
            <div className="mt-1 font-mono text-lg font-semibold">{formatMoney(co.delta_cents ?? 0)}</div>
          </div>
          <div className="rounded border border-[var(--p-border)] p-3">
            <div className="eyebrow text-xs text-[var(--p-text-2)]">
              {t("p.client.changeOrderDetail.requested", undefined, "Requested")}
            </div>
            <div className="mt-1 text-sm">
              {co.requested_label ?? "—"} · {timeAgo(co.created_at)}
            </div>
          </div>
          <div className="rounded border border-[var(--p-border)] p-3">
            <div className="eyebrow text-xs text-[var(--p-text-2)]">
              {t("p.client.changeOrderDetail.decision", undefined, "Decision")}
            </div>
            <div className="mt-1 text-sm">
              {co.decided_at
                ? `${co.state} · ${timeAgo(co.decided_at)}`
                : t("p.client.changeOrderDetail.decisionPending", undefined, "Pending")}
            </div>
          </div>
        </div>
      </header>

      {co.body && (
        <section className="surface p-6">
          <div className="eyebrow mb-2 text-xs text-[var(--p-text-2)]">
            {t("p.client.changeOrderDetail.description", undefined, "Description")}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{co.body}</p>
        </section>
      )}

      {co.decision_note && (
        <section className="surface p-6">
          <div className="eyebrow mb-2 text-xs text-[var(--p-text-2)]">
            {t("p.client.changeOrderDetail.decisionNote", undefined, "Decision note")}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{co.decision_note}</p>
        </section>
      )}

      {decidable && <ChangeOrderDecision slug={slug} proposalId={proposalId} coId={coId} />}
    </div>
  );
}
