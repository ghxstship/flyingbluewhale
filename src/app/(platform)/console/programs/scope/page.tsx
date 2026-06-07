import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.programs.scope.eyebrow", undefined, "Programs")}
          title={t("console.programs.scope.title", undefined, "Program Scope")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.scope.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
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
  const unspecifiedLabel = t("console.programs.scope.unspecified", undefined, "Unspecified");
  const byDiscipline = entries.reduce<Map<string, Map<string, number>>>((map, e) => {
    const d = e.discipline ?? unspecifiedLabel;
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
        eyebrow={t("console.programs.scope.eyebrow", undefined, "Programs")}
        title={t("console.programs.scope.title", undefined, "Program Scope")}
        subtitle={`${disciplines.length} ${disciplines.length === 1 ? t("console.programs.scope.disciplineSingular", undefined, "discipline") : t("console.programs.scope.disciplinePlural", undefined, "disciplines")} · ${totalEvents} ${totalEvents === 1 ? t("console.programs.scope.eventSingular", undefined, "event") : t("console.programs.scope.eventPlural", undefined, "events")} · ${entries.length} ${entries.length === 1 ? t("console.programs.scope.entrySingular", undefined, "entry") : t("console.programs.scope.entryPlural", undefined, "entries")}`}
        action={
          <Button href="/console/participants/entries/new" size="sm">
            {t("console.programs.scope.newEntry", undefined, "+ New Entry")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.programs.scope.metrics.delegations", undefined, "Delegations")}
            value={fmt.number(delegationCount ?? 0)}
            accent
          />
          <MetricCard
            label={t("console.programs.scope.metrics.entries", undefined, "Entries")}
            value={fmt.number(entries.length)}
          />
          <MetricCard
            label={t("console.programs.scope.metrics.approved", undefined, "Approved")}
            value={fmt.number(approved)}
          />
        </div>

        {disciplines.length === 0 ? (
          <EmptyState
            title={t("console.programs.scope.empty.title", undefined, "No Participant Entries Yet")}
            description={t(
              "console.programs.scope.empty.description",
              undefined,
              "Program scope is derived from delegation_entries. Author entries via Console → Participants → Entries.",
            )}
            action={
              <Link href="/console/participants/entries/new" className="ps-btn ps-btn--sm">
                {t("console.programs.scope.newEntry", undefined, "+ New Entry")}
              </Link>
            }
          />
        ) : (
          <section>
            <h3 className="text-sm font-semibold">
              {t("console.programs.scope.byDiscipline", undefined, "By Discipline")}
            </h3>
            <div className="mt-3 space-y-3">
              {disciplines.map(([discipline, evs]) => (
                <div key={discipline} className="surface p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{discipline}</h4>
                    <Badge variant="muted">
                      {evs.size}{" "}
                      {evs.size === 1
                        ? t("console.programs.scope.eventSingular", undefined, "event")
                        : t("console.programs.scope.eventPlural", undefined, "events")}
                    </Badge>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {Array.from(evs.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([event, count]) => (
                        <li key={event} className="flex items-center justify-between">
                          <span className="text-[var(--p-text-2)]">{event}</span>
                          <span className="font-mono text-xs text-[var(--p-text-2)]">
                            {count}{" "}
                            {count === 1
                              ? t("console.programs.scope.participantSingular", undefined, "participant")
                              : t("console.programs.scope.participantPlural", undefined, "participants")}
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
