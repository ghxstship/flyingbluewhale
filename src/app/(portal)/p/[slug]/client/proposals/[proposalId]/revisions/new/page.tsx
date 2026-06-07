import { notFound } from "next/navigation";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { resolveProposalContext } from "@/lib/proposals/portal/queries";
import { getRequestT } from "@/lib/i18n/request";
import { createRevisionRoundAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const { t } = await getRequestT();
  const base = `/p/${slug}/client/proposals/${proposalId}/revisions`;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--p-text-2)]">
          {t("p.client.proposals.revisions.new.eyebrow", undefined, "Open revision round")}
        </div>
        <h1 className="text-lg font-semibold">
          {t("p.client.proposals.revisions.new.title", undefined, "Request Creative Iterations")}
        </h1>
      </header>

      <FormShell
        action={createRevisionRoundAction}
        submitLabel={t("p.client.proposals.revisions.new.submit", undefined, "Open Round")}
        cancelHref={base}
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="proposalId" value={proposalId} />
        <FormField label={t("p.client.proposals.revisions.new.targetLabel", undefined, "Round Target")}>
          <select name="targetKind" defaultValue="proposal" className="ps-input w-full">
            <option value="proposal">
              {t("p.client.proposals.revisions.new.target.proposal", undefined, "Proposal-wide")}
            </option>
            <option value="phase">
              {t("p.client.proposals.revisions.new.target.phase", undefined, "Phase deliverable")}
            </option>
            <option value="change_order">
              {t("p.client.proposals.revisions.new.target.changeOrder", undefined, "Change order")}
            </option>
            <option value="asset">
              {t("p.client.proposals.revisions.new.target.asset", undefined, "Single asset")}
            </option>
          </select>
        </FormField>
        <FormField label={t("p.client.proposals.revisions.new.titleLabel", undefined, "Title")} required>
          <input
            name="title"
            placeholder={t(
              "p.client.proposals.revisions.new.titlePlaceholder",
              undefined,
              "e.g. Greenery palette mockups",
            )}
            required
            className="ps-input w-full"
          />
        </FormField>
        <FormField
          label={t("p.client.proposals.revisions.new.summaryLabel", undefined, "Summary")}
          hint={t("p.client.proposals.revisions.new.summaryHint", undefined, "What's being reviewed?")}
        >
          <textarea
            name="summary"
            rows={4}
            placeholder={t(
              "p.client.proposals.revisions.new.summaryPlaceholder",
              undefined,
              "Reviewer guidance: how to choose, what to ignore, deadline…",
            )}
            className="ps-input w-full"
          />
        </FormField>
      </FormShell>
    </div>
  );
}
