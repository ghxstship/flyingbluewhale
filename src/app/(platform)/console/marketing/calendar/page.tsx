import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Row = { id: string; kind: string; occurs_at: string; label: string | null; visibility: string };

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketing" title="Calendar" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_milestones")
    .select("id, kind, occurs_at, label, visibility")
    .eq("org_id", session.orgId)
    .gte("occurs_at", new Date(Date.now() - 14 * 86_400_000).toISOString())
    .order("occurs_at", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as Row[];

  // Group by day
  const byDay = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const day = r.occurs_at.slice(0, 10);
    (acc[day] ??= []).push(r);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort();

  return (
    <>
      <ModuleHeader
        eyebrow="Marketing"
        title="Calendar"
        subtitle={`${rows.length} milestone${rows.length === 1 ? "" : "s"} across ${days.length} day${days.length === 1 ? "" : "s"}`}
      />
      <div className="page-content space-y-4">
        {days.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">No milestones in the next two weeks.</div>
        ) : (
          days.map((d) => (
            <section key={d} className="surface p-4">
              <h2 className="mb-2 font-mono text-sm text-[var(--text-secondary)]">{new Date(d).toDateString()}</h2>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {byDay[d].map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_TONE[r.kind] ?? "muted"}>{r.kind}</Badge>
                      <span>{r.label ?? "—"}</span>
                    </div>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {new Date(r.occurs_at).toLocaleTimeString()}
                    </span>
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
