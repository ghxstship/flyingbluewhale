import Link from "next/link";
import { getOrGenerateDigest, type DigestPriority } from "@/lib/ai/digest";
import { DigestRefreshButton } from "./DigestRefreshButton";

const URGENCY_CLASS: Record<DigestPriority["urgency"], string> = {
  high: "text-[var(--color-error)]",
  medium: "text-[var(--color-warning)]",
  low: "text-[var(--text-secondary)]",
};

const URGENCY_DOT: Record<DigestPriority["urgency"], string> = {
  high: "bg-[var(--color-error)]",
  medium: "bg-[var(--color-warning)]",
  low: "bg-[var(--text-tertiary)]",
};

const CATEGORY_LABEL: Record<DigestPriority["category"], string> = {
  proposals: "Proposals",
  invoices: "Invoices",
  incidents: "Incidents",
  advancing: "Advancing",
  crew: "Crew",
  projects: "Projects",
  general: "General",
};

/**
 * Server component — reads or generates the AI operator digest and renders
 * a priority panel on the console home page.
 *
 * Competitive source: HoneyBook AI Priority Lists + Business Insights Reports.
 */
export async function DigestWidget({ userId, orgId }: { userId: string; orgId: string }) {
  const digest = await getOrGenerateDigest(userId, orgId);

  const sortedPriorities = [...digest.priorities].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  });

  return (
    <section className="surface rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-[var(--org-primary)]">
            AI Briefing
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {new Date(digest.generated_at).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <DigestRefreshButton />
      </div>

      <div className="px-4 py-3 space-y-4">
        {digest.summary && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{digest.summary}</p>
        )}

        {sortedPriorities.length > 0 ? (
          <ul className="space-y-2">
            {sortedPriorities.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 flex-none rounded-full ${URGENCY_DOT[p.urgency]}`}
                  aria-label={p.urgency}
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium uppercase tracking-wide mr-2 ${URGENCY_CLASS[p.urgency]}`}>
                    {CATEGORY_LABEL[p.category] ?? p.category}
                  </span>
                  {p.href ? (
                    <Link
                      href={p.href}
                      className="text-sm text-[var(--text-primary)] hover:text-[var(--org-primary)] hover:underline"
                    >
                      {p.action}
                    </Link>
                  ) : (
                    <span className="text-sm text-[var(--text-primary)]">{p.action}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">No priority items right now.</p>
        )}
      </div>
    </section>
  );
}
