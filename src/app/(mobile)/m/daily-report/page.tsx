import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters } from "@/lib/i18n/request";
import { DailyReportView, type ReportNote } from "./DailyReportView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Daily Report (kit 34 v3.7) — the Operations hub's end-of-day
 * rollup. Aggregates the day's REAL shift notes + the org's open-incident count
 * into one filable/exportable record (no fabricated ops-seed data). Distinct
 * from `/m/daily-log` (the weather+notes site log this report files into).
 */
export default async function DailyReportPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // End-of-day rollup: today's notes (server-local midnight boundary).
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const sinceIso = dayStart.toISOString();

  const [{ data: noteRows }, incidentsRes] = await Promise.all([
    supabase
      .from("shift_notes")
      .select("id, author_id, body, as_manager, created_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .neq("incident_state", "closed"),
  ]);

  const notes = (noteRows ?? []) as Array<{
    id: string;
    author_id: string | null;
    body: string;
    as_manager: boolean;
    created_at: string;
  }>;

  const authorIds = [...new Set(notes.map((n) => n.author_id).filter(Boolean) as string[])];
  const nameMap = new Map<string, string>();
  if (authorIds.length) {
    // soft-delete-exempt: resolving author display names by id — an archived
    // user's name should still label their historical shift note.
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", authorIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameMap.set(u.id, u.name ?? u.email ?? "");
    }
  }

  const reportNotes: ReportNote[] = notes.map((n) => ({
    id: n.id,
    author: n.author_id ? nameMap.get(n.author_id) || "Crew" : "Crew",
    asManager: n.as_manager,
    body: n.body,
    when: fmt.relative(n.created_at, { compact: true }),
  }));
  const managerNotes = notes.filter((n) => n.as_manager).length;

  return (
    <DailyReportView
      canManage={isManagerPlus(session)}
      notes={reportNotes}
      openIncidents={incidentsRes.count ?? 0}
      managerNotes={managerNotes}
    />
  );
}
