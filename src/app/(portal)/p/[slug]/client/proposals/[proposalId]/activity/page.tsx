import { notFound } from "next/navigation";
import { resolveProposalContext, listActivity } from "@/lib/proposals/portal/queries";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const activity = await listActivity(proposalId, 200);

  return (
    <div className="space-y-4 p-6">
      <header className="surface-raised p-5">
        <div className="eyebrow text-xs text-[var(--text-muted)]">Activity log</div>
        <h1 className="text-lg font-semibold">Full Audit Trail</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Every gate check, change order decision, revision round, approval, and file upload — chronological.
        </p>
      </header>

      {activity.length === 0 ? (
        <div className="surface-raised p-12 text-center text-[var(--text-muted)]">No activity yet.</div>
      ) : (
        <ol className="space-y-2">
          {activity.map((e) => (
            <li key={e.id} className="surface-raised flex items-start gap-3 p-4">
              <span
                className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--org-primary)]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm">{e.summary}</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {e.actor_label ?? "—"} · {timeAgo(e.occurred_at)}
                </div>
              </div>
              <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">{e.kind}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
