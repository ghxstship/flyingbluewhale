import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";

type ViewRow = {
  id: string;
  viewed_at: string;
  viewer_persona: string | null;
  viewer_user_id: string | null;
};

/**
 * Engagement analytics panel for the ATLVS console proposal detail.
 * Shows total view count + the 10 most recent views with timestamp and persona.
 * Mirrors Rentman's quote engagement tracking feature.
 */
export async function ProposalViewsPanel({
  proposalId,
  orgId,
}: {
  proposalId: string;
  orgId: string;
}) {
  const supabase = await createClient();

  const [{ count }, { data: recent }] = await Promise.all([
    supabase
      .from("proposal_views")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", proposalId)
      .eq("org_id", orgId),
    supabase
      .from("proposal_views")
      .select("id, viewed_at, viewer_persona, viewer_user_id")
      .eq("proposal_id", proposalId)
      .eq("org_id", orgId)
      .order("viewed_at", { ascending: false })
      .limit(10),
  ]);

  const rows = (recent ?? []) as ViewRow[];
  const total = count ?? 0;

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Engagement</h3>
        <span className="font-mono text-xs text-[var(--p-text-2)]">{total} view{total !== 1 ? "s" : ""}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--p-text-2)]">No views recorded yet. Views are logged when recipients open the proposal in the GVTEWAY portal.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--p-border)]">
          {rows.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--p-accent)]" aria-hidden />
                <span className="text-[var(--p-text-1)]">
                  {v.viewer_persona ? <span className="capitalize">{v.viewer_persona}</span> : "Portal user"}
                </span>
              </div>
              <span className="font-mono text-xs text-[var(--p-text-2)]">{timeAgo(v.viewed_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
