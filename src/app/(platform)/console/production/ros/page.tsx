import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CueForm, CueRow } from "./CueForm";
import type { Cue } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RunOfShowPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Run of show" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("cues")
    .select("id, scheduled_at, lane, label, description, status, duration_seconds, owner_id")
    .eq("org_id", session.orgId)
    .order("scheduled_at", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as Cue[];

  const grouped = new Map<string, Cue[]>();
  for (const r of rows) {
    const key = r.scheduled_at.slice(0, 10);
    const list = grouped.get(key) ?? [];
    list.push(r);
    grouped.set(key, list);
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Run of show"
        subtitle={`${rows.length} cue${rows.length === 1 ? "" : "s"} on the show plan`}
      />
      <div className="page-content max-w-5xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Add a cue</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Cues live across departments. Status flows pending → standby → live → done.
          </p>
          <div className="mt-4">
            <CueForm />
          </div>
        </section>

        {grouped.size === 0 ? (
          <section className="surface p-8 text-center text-sm text-[var(--text-muted)]">
            No cues yet — author one above.
          </section>
        ) : (
          Array.from(grouped.entries()).map(([day, cues]) => (
            <section key={day} className="surface">
              <header className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2.5">
                <h3 className="text-sm font-semibold">
                  {new Date(day).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <Badge variant="muted">
                  {cues.length} cue{cues.length === 1 ? "" : "s"}
                </Badge>
              </header>
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Lane</th>
                    <th>Cue</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cues.map((c) => (
                    <CueRow key={c.id} cue={c} />
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}
      </div>
    </>
  );
}
