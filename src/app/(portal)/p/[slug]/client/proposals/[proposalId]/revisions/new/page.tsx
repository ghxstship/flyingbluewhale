import { notFound } from "next/navigation";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { resolveProposalContext } from "@/lib/proposals/portal/queries";
import { createRevisionRoundAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const base = `/p/${slug}/client/proposals/${proposalId}/revisions`;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="surface-raised p-5">
        <div className="eyebrow text-xs text-[var(--text-muted)]">Open revision round</div>
        <h1 className="text-lg font-semibold">Request Creative Iterations</h1>
      </header>

      <FormShell action={createRevisionRoundAction} submitLabel="Open Round" cancelHref={base}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="proposalId" value={proposalId} />
        <FormField label="Round Target">
          <select name="targetKind" defaultValue="proposal" className="input-base w-full">
            <option value="proposal">Proposal-wide</option>
            <option value="phase">Phase deliverable</option>
            <option value="change_order">Change order</option>
            <option value="asset">Single asset</option>
          </select>
        </FormField>
        <FormField label="Title" required>
          <input name="title" placeholder="e.g. Greenery palette mockups" required className="input-base w-full" />
        </FormField>
        <FormField label="Summary" hint="What's being reviewed?">
          <textarea
            name="summary"
            rows={4}
            placeholder="Reviewer guidance: how to choose, what to ignore, deadline…"
            className="input-base w-full"
          />
        </FormField>
      </FormShell>
    </div>
  );
}
