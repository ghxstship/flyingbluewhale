import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Item = { kind: string; id: string; title: string; when: string; project: string | null };

function dayKey(d: string): string {
  return new Date(d).toISOString().slice(0, 10);
}

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const now = new Date();
  const end = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

  const [tasks, events, briefings, inspections, dispatchRuns] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_at, project:project_id(name)")
      .eq("org_id", session.orgId)
      .in("status", ["todo", "in_progress", "blocked", "review"])
      .gte("due_at", now.toISOString().slice(0, 10))
      .lte("due_at", end.toISOString().slice(0, 10))
      .order("due_at"),
    supabase
      .from("events")
      .select("id, name, starts_at, project:project_id(name)")
      .eq("org_id", session.orgId)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at"),
    supabase
      .from("safety_briefings")
      .select("id, topic, scheduled_for, project:project_id(name)")
      .eq("org_id", session.orgId)
      .eq("status", "scheduled")
      .gte("scheduled_for", now.toISOString())
      .lte("scheduled_for", end.toISOString())
      .order("scheduled_for"),
    supabase
      .from("inspections")
      .select("id, name, scheduled_for, project:project_id(name)")
      .eq("org_id", session.orgId)
      .in("status", ["scheduled", "in_progress"])
      .gte("scheduled_for", now.toISOString())
      .lte("scheduled_for", end.toISOString())
      .order("scheduled_for"),
    supabase
      .from("dispatch_runs")
      .select(
        "id, fleet, vehicle_ref, scheduled_depart, origin:origin_venue_id(name), destination:destination_venue_id(name)",
      )
      .eq("org_id", session.orgId)
      .gte("scheduled_depart", now.toISOString())
      .lte("scheduled_depart", end.toISOString())
      .order("scheduled_depart"),
  ]);

  const items: Item[] = [
    ...(tasks.data ?? []).map((t) => ({
      kind: "task",
      id: t.id,
      title: t.title,
      when: t.due_at as string,
      project: (t.project as unknown as { name: string | null } | null)?.name ?? null,
    })),
    ...(events.data ?? []).map((e) => ({
      kind: "event",
      id: e.id,
      title: e.name,
      when: e.starts_at as string,
      project: (e.project as unknown as { name: string | null } | null)?.name ?? null,
    })),
    ...(briefings.data ?? []).map((b) => ({
      kind: "briefing",
      id: b.id,
      title: b.topic,
      when: b.scheduled_for as string,
      project: (b.project as unknown as { name: string | null } | null)?.name ?? null,
    })),
    ...(inspections.data ?? []).map((i) => ({
      kind: "inspection",
      id: i.id,
      title: i.name,
      when: i.scheduled_for as string,
      project: (i.project as unknown as { name: string | null } | null)?.name ?? null,
    })),
    ...(dispatchRuns.data ?? []).map((d) => {
      const origin = (d.origin as unknown as { name: string | null } | null)?.name;
      const destination = (d.destination as unknown as { name: string | null } | null)?.name;
      const route = origin && destination ? `${origin} → ${destination}` : (d.vehicle_ref ?? "Dispatch");
      return {
        kind: "dispatch" as const,
        id: d.id,
        title: `${d.fleet.toUpperCase()} · ${route}`,
        when: d.scheduled_depart,
        project: null,
      };
    }),
  ].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());

  const buckets = items.reduce<Record<string, Item[]>>((acc, it) => {
    const k = dayKey(it.when);
    (acc[k] ??= []).push(it);
    return acc;
  }, {});

  const KIND_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
    task: "muted",
    event: "success",
    briefing: "warning",
    inspection: "info",
    dispatch: "info",
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Look-ahead — next 21 days"
        subtitle={`${items.length} item${items.length === 1 ? "" : "s"} across tasks, events, briefings, inspections, dispatches.`}
      />
      <div className="page-content space-y-3">
        {Object.keys(buckets).length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-muted)]">Nothing scheduled in the next 21 days.</div>
        ) : (
          Object.entries(buckets).map(([day, dayItems]) => (
            <section key={day} className="surface p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                {fmt.dateParts(day + "T00:00:00", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {dayItems.map((it) => (
                  <li
                    key={`${it.kind}-${it.id}`}
                    className="surface-inset flex items-center justify-between gap-3 p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={KIND_TONE[it.kind] ?? "muted"}>{it.kind}</Badge>
                      <span>{it.title}</span>
                      {it.project && <span className="text-xs text-[var(--text-muted)]">· {it.project}</span>}
                    </div>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{fmt.dateParts(it.when, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
