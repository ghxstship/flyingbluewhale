import { notFound } from "next/navigation";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { resolveProposalContext } from "@/lib/proposals/portal/queries";
import { createChangeOrderAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const base = `/p/${slug}/client/proposals/${proposalId}/change-orders`;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--text-muted)]">New change order</div>
        <h1 className="text-lg font-semibold">Request a Scope Change</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          We&apos;ll price it within 2 business days and send it back to you for a decision.
        </p>
      </header>

      <FormShell action={createChangeOrderAction} submitLabel="Submit Request" cancelHref={base}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="proposalId" value={proposalId} />
        <FormField label="Title" required>
          <input name="title" placeholder="e.g. Add 2 planter boxes to ring" required className="input-base w-full" />
        </FormField>
        <FormField label="Description" hint="What is changing and why?">
          <textarea
            name="body"
            rows={5}
            placeholder="Describe the scope, location, quantity, and any reference to the original deliverable…"
            className="input-base w-full"
          />
        </FormField>
      </FormShell>
    </div>
  );
}
