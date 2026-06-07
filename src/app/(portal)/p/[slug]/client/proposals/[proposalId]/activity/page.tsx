import { notFound } from "next/navigation";
import { resolveProposalContext, listActivity } from "@/lib/proposals/portal/queries";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const activity = await listActivity(proposalId, 200);
  const { t } = await getRequestT();

  return (
    <div className="space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--p-text-2)]">
          {t("p.client.proposals.activity.eyebrow", undefined, "Activity log")}
        </div>
        <h1 className="text-lg font-semibold">
          {t("p.client.proposals.activity.title", undefined, "Full Audit Trail")}
        </h1>
        <p className="mt-1 text-sm text-[var(--p-text-2)]">
          {t(
            "p.client.proposals.activity.description",
            undefined,
            "Every gate check, change order decision, revision round, approval, and file upload — chronological.",
          )}
        </p>
      </header>

      {activity.length === 0 ? (
        <div className="surface p-12 text-center text-[var(--p-text-2)]">
          {t("p.client.proposals.activity.empty", undefined, "No activity yet.")}
        </div>
      ) : (
        <ol className="space-y-2">
          {activity.map((e) => (
            <li key={e.id} className="surface flex items-start gap-3 p-4">
              <span
                className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--p-accent)]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm">{e.summary}</div>
                <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
                  {e.actor_label ?? t("common.dash", undefined, "—")} · {timeAgo(e.occurred_at)}
                </div>
              </div>
              <span className="font-mono text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">{e.kind}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
