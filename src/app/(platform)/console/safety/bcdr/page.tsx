import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type ExerciseRow = {
  id: string;
  name: string;
  kind: string;
  scheduled_at: string | null;
};

type PlaybookRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  version: number;
  updated_at: string;
};

const KIND_TONE: Record<string, "muted" | "info" | "warning"> = {
  ttx: "info",
  full_scale: "warning",
  drill: "muted",
  walkthrough: "muted",
};

function fmt(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="BC / DR" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: exData }, { data: pbData }] = await Promise.all([
    supabase
      .from("readiness_exercises")
      .select("id, name, kind, scheduled_at")
      .eq("org_id", session.orgId)
      .order("scheduled_at", { ascending: true })
      .limit(50),
    supabase
      .from("playbooks")
      .select("id, slug, title, status, version, updated_at")
      .eq("org_id", session.orgId)
      .eq("kind", "crisis")
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const exercises = (exData ?? []) as ExerciseRow[];
  const playbooks = (pbData ?? []) as PlaybookRow[];
  const upcoming = exercises.filter((e) => e.scheduled_at && new Date(e.scheduled_at).getTime() >= Date.now());
  const published = playbooks.filter((p) => p.status === "published").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="BC / DR"
        subtitle="Business continuity + disaster recovery — runbooks plus exercises."
        action={
          <Button href="/console/safety/playbooks/new" size="sm">
            + New Runbook
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Crisis Runbooks" value={playbooks.length.toLocaleString()} accent />
          <MetricCard label="Published" value={published.toLocaleString()} />
          <MetricCard label="Exercises Scheduled" value={upcoming.length.toLocaleString()} />
        </div>

        <section>
          <h3 className="text-sm font-semibold">Crisis Runbooks</h3>
          <ul className="mt-3 space-y-2">
            {playbooks.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title="No Crisis Runbooks Yet"
                  description="Author crisis-tagged playbooks (evac, weather hold, IT outage) — they appear here."
                  action={
                    <Link href="/console/safety/playbooks/new" className="btn btn-secondary btn-sm">
                      + New Runbook
                    </Link>
                  }
                />
              </li>
            ) : (
              playbooks.map((p) => (
                <li key={p.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <Link
                      href={`/console/safety/playbooks/${p.slug}`}
                      className="text-sm font-medium hover:text-[var(--org-primary)]"
                    >
                      {p.title}
                    </Link>
                    <div className="font-mono text-xs text-[var(--text-muted)]">v{p.version}</div>
                  </div>
                  <Badge variant={p.status === "published" ? "success" : "muted"}>{p.status}</Badge>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Exercises</h3>
          <ul className="mt-3 space-y-2">
            {exercises.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title="No Exercises Scheduled"
                  description="TTX, drills, full-scale exercises live in Programs → Readiness."
                  action={
                    <Link href="/console/programs/readiness" className="btn btn-secondary btn-sm">
                      Open Readiness
                    </Link>
                  }
                />
              </li>
            ) : (
              exercises.map((e) => (
                <li key={e.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">{fmt(e.scheduled_at)}</div>
                  </div>
                  <Badge variant={KIND_TONE[e.kind] ?? "muted"}>{e.kind.replace(/_/g, " ")}</Badge>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
