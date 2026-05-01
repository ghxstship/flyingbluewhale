import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type EntryRow = {
  id: string;
  discipline: string | null;
  event: string | null;
  participant_name: string;
  status: string;
  delegation: { code: string | null; name: string | null } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Programs" title="Program Scope" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ count: delegationCount }, { data: entriesData }] = await Promise.all([
    supabase.from("delegations").select("*", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase
      .from("delegation_entries")
      .select("id, discipline, event, participant_name, status, delegation:delegation_id(code, name)")
      .eq("org_id", session.orgId)
      .order("discipline", { ascending: true })
      .limit(2000),
  ]);

  const entries = (entriesData ?? []) as unknown as EntryRow[];

  // Roll up by discipline → events
  const byDiscipline = entries.reduce<Map<string, Map<string, number>>>((map, e) => {
    const d = e.discipline ?? "Unspecified";
    if (!map.has(d)) map.set(d, new Map());
    const ev = e.event ?? "—";
    map.get(d)!.set(ev, (map.get(d)!.get(ev) ?? 0) + 1);
    return map;
  }, new Map());

  const disciplines = Array.from(byDiscipline.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const totalEvents = disciplines.reduce((sum, [, evs]) => sum + evs.size, 0);
  const approved = entries.filter((e) => e.status === "approved").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Programs"
        title="Program Scope"
        subtitle={`${disciplines.length} discipline${disciplines.length === 1 ? "" : "s"} · ${totalEvents} event${totalEvents === 1 ? "" : "s"} · ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
        action={
          <Button href="/console/participants/entries/new" size="sm">
            + New Entry
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Delegations" value={(delegationCount ?? 0).toLocaleString()} accent />
          <MetricCard label="Entries" value={entries.length.toLocaleString()} />
          <MetricCard label="Approved" value={approved.toLocaleString()} />
        </div>

        {disciplines.length === 0 ? (
          <EmptyState
            title="No Participant Entries Yet"
            description="Program scope is derived from delegation_entries. Author entries via Console → Participants → Entries."
            action={
              <Link href="/console/participants/entries/new" className="btn btn-primary btn-sm">
                + New Entry
              </Link>
            }
          />
        ) : (
          <section>
            <h3 className="text-sm font-semibold">By Discipline</h3>
            <div className="mt-3 space-y-3">
              {disciplines.map(([discipline, evs]) => (
                <div key={discipline} className="surface p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{discipline}</h4>
                    <Badge variant="muted">
                      {evs.size} event{evs.size === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {Array.from(evs.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([event, count]) => (
                        <li key={event} className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">{event}</span>
                          <span className="font-mono text-xs text-[var(--text-muted)]">
                            {count} participant{count === 1 ? "" : "s"}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
