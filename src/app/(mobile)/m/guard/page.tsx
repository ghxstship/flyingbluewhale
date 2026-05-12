import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { urlFor } from "@/lib/urls";
import { hasSupabase } from "@/lib/env";
import type { GuardTour } from "@/lib/supabase/types";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type TourRow = GuardTour;

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  in_progress: "info",
  completed: "success",
  cancelled: "muted",
  overdue: "error",
};

export default async function MobileGuardPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string | null): string => {
    if (!iso) return "—";
    return fmt.time(iso);
  };
  const all = (await listOrgScoped("guard_tours", session.orgId, {
    orderBy: "next_run_at",
    ascending: true,
    limit: 200,
  })) as TourRow[];
  const rows = all.filter((r) => r.guard_id === session.userId).slice(0, 50);

  const active = rows.filter((r) => r.status === "in_progress").length;
  const overdue = rows.filter((r) => r.status === "overdue").length;
  const upcoming = rows.filter((r) => r.status === "scheduled").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        Field
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Guard</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0
          ? "No tours assigned to you."
          : `${active} in progress · ${overdue} overdue · ${upcoming} scheduled`}
      </p>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Assigned Tours"
              description="Patrol routes appear here when a supervisor assigns you. See all tours in Safety → Guard tours."
              action={
                <Link href={urlFor("platform", "/safety/guard-tours")} className="btn btn-secondary btn-sm">
                  Open guard tours
                </Link>
              }
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
                    {r.venue_id ? "Assigned venue" : "Any venue"}
                    {r.cadence_minutes ? ` · every ${r.cadence_minutes}m` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>
                    {r.next_run_at && r.status === "scheduled" && (
                      <Badge variant="muted">Next {fmtTime(r.next_run_at)}</Badge>
                    )}
                    {r.started_at && !r.completed_at && <Badge variant="info">Started {fmtTime(r.started_at)}</Badge>}
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
