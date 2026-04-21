export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/components/detail/DetailShell";

/**
 * Dispatch = today's + next-48h events, annotated with the rentals
 * active in that window. A "dispatch board" in the legacy sense doesn't
 * need its own table — the scheduling data already covers it.
 */
export default async function DispatchPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const in48h = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
  const [{ data: events }, { data: rentals }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, status, starts_at, ends_at, project_id")
      .eq("org_id", session.orgId)
      .gte("starts_at", nowIso)
      .lte("starts_at", in48h)
      .order("starts_at", { ascending: true }),
    supabase
      .from("rentals")
      .select("id, equipment_id, starts_at, ends_at")
      .eq("org_id", session.orgId)
      .gte("ends_at", nowIso)
      .lte("starts_at", in48h),
  ]);
  const eventRows = (events ?? []) as Array<{ id: string; name: string; status: string; starts_at: string; ends_at: string; project_id: string | null }>;
  const rentalCount = rentals?.length ?? 0;
  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Dispatch"
        subtitle={`${eventRows.length} event${eventRows.length === 1 ? "" : "s"} · ${rentalCount} active rental${rentalCount === 1 ? "" : "s"} in the next 48h`}
      />
      <div className="page-content max-w-5xl">
        {eventRows.length === 0 ? (
          <EmptyState
            title="Nothing dispatches in the next 48 hours"
            description="Events in your window appear here as they're scheduled. Active rentals across the same window are counted alongside."
          />
        ) : (
          <ul className="space-y-2">
            {eventRows.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/console/events/${e.id}`}
                  className="surface hover-lift flex items-center justify-between p-4"
                >
                  <div>
                    <div className="text-sm font-semibold">{e.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                      {fmtDateTime(e.starts_at)} → {fmtDateTime(e.ends_at)}
                    </div>
                  </div>
                  <StatusBadge status={e.status ?? "draft"} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
