export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";
import { formatMinutes } from "@/lib/db/timesheets";

/**
 * Portal `/p/[slug]/crew/timesheets` — read-only list of the viewer's own
 * timesheets for this project. The console manager surface authors approval
 * decisions; this is the worker's mirror. RLS `utt_ts_party` already scopes
 * SELECT to the caller's own party rows.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const session = await requireSession();
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();

  type Row = {
    id: string;
    period_start: string;
    period_end: string;
    state: string;
    total_minutes: number;
    billable_minutes: number;
  };
  let rows: Row[] = [];

  if (project) {
    // Resolve the viewer's party in this org so we scope to their own sheets
    // (timesheets key on party_id, not user_id).
    const { data: party } = await supabase
      .from("parties")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("auth_user_id", session.userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (party) {
      const { data } = await supabase
        .from("timesheets")
        .select("id, period_start, period_end, state, total_minutes, billable_minutes")
        .eq("project_id", project.id)
        .eq("party_id", party.id)
        .order("period_start", { ascending: false });
      rows = (data ?? []) as Row[];
    }
  }

  return (
    <PortalSubpage
      slug={slug}
      persona="crew"
      title={t("p.crew.timesheets.title", undefined, "Timesheets")}
      subtitle={t("p.crew.timesheets.subtitle", undefined, "Your timesheets and their approval state for this project")}
    >
      {rows.length === 0 ? (
        <EmptyState
          title={t("p.crew.timesheets.empty.title", undefined, "No Timesheets Yet")}
          description={t(
            "p.crew.timesheets.empty.description",
            undefined,
            "Once a pay period is compiled and submitted, it shows here with its review state.",
          )}
        />
      ) : (
        <table className="ps-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("p.crew.timesheets.col.period", undefined, "Period")}</th>
              <th>{t("p.crew.timesheets.col.hours", undefined, "Hours")}</th>
              <th>{t("p.crew.timesheets.col.billable", undefined, "Billable")}</th>
              <th>{t("p.crew.timesheets.col.state", undefined, "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">
                  {fmtDate(r.period_start)} – {fmtDate(r.period_end)}
                </td>
                <td className="font-mono text-xs">{formatMinutes(r.total_minutes)}</td>
                <td className="font-mono text-xs">{formatMinutes(r.billable_minutes)}</td>
                <td>
                  <StatusBadge status={r.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
