import { notFound } from "next/navigation";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { getRequestT } from "@/lib/i18n/request";
import { resolveProposalContext } from "@/lib/proposals/portal/queries";
import { createChangeOrderAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const { t } = await getRequestT();
  const base = `/p/${slug}/client/proposals/${proposalId}/change-orders`;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--p-text-2)]">
          {t("p.client.proposals.changeOrders.new.eyebrow", undefined, "New change order")}
        </div>
        <h1 className="text-lg font-semibold">
          {t("p.client.proposals.changeOrders.new.title", undefined, "Request a Scope Change")}
        </h1>
        <p className="mt-1 text-sm text-[var(--p-text-2)]">
          {t(
            "p.client.proposals.changeOrders.new.description",
            undefined,
            "We'll price it within 2 business days and send it back to you for a decision.",
          )}
        </p>
      </header>

      <FormShell
        action={createChangeOrderAction}
        submitLabel={t("p.client.proposals.changeOrders.new.submit", undefined, "Submit Request")}
        cancelHref={base}
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="proposalId" value={proposalId} />
        <FormField label={t("p.client.proposals.changeOrders.new.fields.title.label", undefined, "Title")} required>
          <input
            name="title"
            placeholder={t(
              "p.client.proposals.changeOrders.new.fields.title.placeholder",
              undefined,
              "e.g. Add 2 planter boxes to ring",
            )}
            required
            className="ps-input w-full"
          />
        </FormField>
        <FormField
          label={t("p.client.proposals.changeOrders.new.fields.description.label", undefined, "Description")}
          hint={t(
            "p.client.proposals.changeOrders.new.fields.description.hint",
            undefined,
            "What is changing and why?",
          )}
        >
          <textarea
            name="body"
            rows={5}
            placeholder={t(
              "p.client.proposals.changeOrders.new.fields.description.placeholder",
              undefined,
              "Describe the scope, location, quantity, and any reference to the original deliverable…",
            )}
            className="ps-input w-full"
          />
        </FormField>
      </FormShell>
    </div>
  );
}
