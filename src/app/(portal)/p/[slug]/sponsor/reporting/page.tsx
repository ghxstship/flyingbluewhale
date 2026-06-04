export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  let scans = 0;
  let tickets = 0;
  if (project) {
    const supabase = await createClient();
    // Tickets are assignments WHERE catalog_kind='ticket' on this project.
    const { count: ticketCount } = await supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("catalog_kind", "ticket")
      .is("deleted_at", null);
    tickets = ticketCount ?? 0;

    // Scans are assignment_events for ticket assignments on this project.
    const { data: ticketAssignments } = await supabase
      .from("assignments")
      .select("id")
      .eq("project_id", project.id)
      .eq("catalog_kind", "ticket")
      .is("deleted_at", null);
    const ids = (ticketAssignments ?? []).map((a) => a.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from("assignment_events")
        .select("id", { count: "exact", head: true })
        .eq("event_kind", "scan")
        .eq("result", "accepted")
        .in("assignment_id", ids);
      scans = count ?? 0;
    }
  }
  return (
    <PortalSubpage
      slug={slug}
      persona="sponsor"
      title={t("p.sponsor.reporting.title", undefined, "Reporting")}
      subtitle={t("p.sponsor.reporting.subtitle", undefined, "Attendance + activation metrics")}
    >
      {scans === 0 && tickets === 0 ? (
        <EmptyState
          title={t("p.sponsor.reporting.empty.title", undefined, "Reporting Starts After the First Scan")}
          description={t(
            "p.sponsor.reporting.empty.description",
            undefined,
            "Real-time counts appear here once doors open.",
          )}
        />
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="surface p-5">
            <dt className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              {t("p.sponsor.reporting.tickets_issued", undefined, "Tickets issued")}
            </dt>
            <dd className="mt-2 text-3xl font-semibold">{fmt.number(tickets)}</dd>
          </div>
          <div className="surface p-5">
            <dt className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              {t("p.sponsor.reporting.scans_recorded", undefined, "Scans recorded")}
            </dt>
            <dd className="mt-2 text-3xl font-semibold">{fmt.number(scans)}</dd>
          </div>
        </dl>
      )}
    </PortalSubpage>
  );
}
