import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { TimesheetAuditClient } from "./TimesheetAuditClient";

export const dynamic = "force-dynamic";

type TimeEntry = {
  id: string;
  crew_name: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  date: string;
};

export default async function TimesheetAuditPage() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Timesheet Audit" />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.timesheets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, clock_in, clock_out, total_minutes, crew_member_id")
    .eq("org_id", session.orgId)
    .gte("clock_in", cutoff.toISOString())
    .order("clock_in", { ascending: false })
    .limit(200);

  const rawEntries = (entries ?? []) as Array<{
    id: string;
    clock_in: string;
    clock_out: string | null;
    total_minutes: number | null;
    crew_member_id: string;
  }>;

  const crewIds = Array.from(new Set(rawEntries.map((e) => e.crew_member_id).filter(Boolean)));
  const nameById = new Map<string, string>();
  if (crewIds.length > 0) {
    const { data: crew } = await supabase
      .from("crew_members")
      .select("id, name")
      .eq("org_id", session.orgId)
      .in("id", crewIds);
    for (const c of (crew ?? []) as Array<{ id: string; name: string }>) nameById.set(c.id, c.name);
  }

  const timeEntries: TimeEntry[] = rawEntries.map((e) => ({
    id: e.id,
    crew_name: nameById.get(e.crew_member_id) ?? "Unknown",
    clock_in: e.clock_in,
    clock_out: e.clock_out,
    total_minutes: e.total_minutes,
    date: e.clock_in.slice(0, 10),
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="Finance · Timesheets"
        title="Timesheet Audit"
        subtitle="AI-powered anomaly detection across the last 14 days of time entries"
      />
      <div className="page-content">
        <TimesheetAuditClient entries={timeEntries} />
      </div>
    </>
  );
}
