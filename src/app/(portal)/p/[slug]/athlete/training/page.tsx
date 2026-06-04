import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: { name: string | null } | null;
};

const TRAINING_PATTERN = /(training|practice|drill|warm-up|warmup|warm up)/i;

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "info",
  in_progress: "warning",
  live: "success",
  complete: "muted",
  cancelled: "error",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Training" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(200);

  const all = (data ?? []) as unknown as EventRow[];
  const sessions = all.filter((e) => TRAINING_PATTERN.test(e.name));
  const upcoming = sessions.filter((s) => new Date(s.starts_at).getTime() >= Date.now());
  const past = sessions.filter((s) => new Date(s.starts_at).getTime() < Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Athlete"
        title="Training"
        subtitle={`${sessions.length} session${sessions.length === 1 ? "" : "s"} · ${upcoming.length} Upcoming`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Athlete", href: `/p/${slug}/athlete` },
          { label: "Training" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming" value={fmtIntl.number(upcoming.length)} accent={upcoming.length > 0} />
          <MetricCard
            label="This Week"
            value={fmtIntl.number(
              sessions.filter((s) => {
                const t = new Date(s.starts_at).getTime();
                return t >= Date.now() && t < Date.now() + 7 * 86_400_000;
              }).length,
            )}
          />
          <MetricCard label="Completed" value={fmtIntl.number(past.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Upcoming Sessions</h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No training sessions scheduled.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{s.name}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {fmt(s.starts_at)} → {fmt(s.ends_at)}
                      {s.location?.name ? ` · ${s.location.name}` : ""}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[s.status] ?? "muted"}>{toTitle(s.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="surface p-5 opacity-70">
            <h3 className="text-sm font-semibold">Recent Sessions</h3>
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {past.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    <span className="ms-2 font-mono text-[10px] text-[var(--text-muted)]">{fmt(s.starts_at)}</span>
                  </div>
                  <Badge variant="muted">{toTitle(s.status)}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          Training sessions are events tagged via name (training / practice / drill / warm-up). Producer authors them in{" "}
          <code>/console/programs/training</code>; this view is filtered for athletes.
        </p>
      </div>
    </>
  );
}
