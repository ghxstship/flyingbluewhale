export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  let scans = 0;
  let tickets = 0;
  if (project) {
    const supabase = await createClient();
    const { data: ticketRows } = await supabase
      .from("tickets")
      .select("id")
      .eq("project_id", project.id);
    const ticketIds = (ticketRows ?? []).map((t) => t.id);
    tickets = ticketIds.length;
    if (ticketIds.length > 0) {
      const { count } = await supabase
        .from("ticket_scans")
        .select("id", { count: "exact", head: true })
        .in("ticket_id", ticketIds);
      scans = count ?? 0;
    }
  }
  return (
    <PortalSubpage slug={slug} persona="sponsor" title="Reporting" subtitle="Attendance + activation metrics">
      {scans === 0 && tickets === 0 ? (
        <EmptyState title="Reporting starts after the first scan" description="Real-time counts appear here once doors open." />
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="surface p-5">
            <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Tickets issued</dt>
            <dd className="mt-2 text-3xl font-semibold">{tickets.toLocaleString()}</dd>
          </div>
          <div className="surface p-5">
            <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Scans recorded</dt>
            <dd className="mt-2 text-3xl font-semibold">{scans.toLocaleString()}</dd>
          </div>
        </dl>
      )}
    </PortalSubpage>
  );
}
