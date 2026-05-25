import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { formatDateParts } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  description: string | null;
  location: { name: string | null } | null;
};

const PRESS_PATTERN = /(press[- ]?conference|pressconf|press[- ]?brief|media[- ]?brief|presser)/i;

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "info",
  in_progress: "warning",
  live: "success",
  complete: "muted",
  cancelled: "error",
};

function fmt(iso: string): string {
  return formatDateParts(iso, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Press Conferences" />
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
    .select("id, name, starts_at, ends_at, status, description, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(200);

  const all = ((data ?? []) as unknown as EventRow[]) ?? [];
  const conferences = all.filter((e) => PRESS_PATTERN.test(e.name));
  const upcoming = conferences.filter((c) => new Date(c.starts_at).getTime() >= Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Media"
        title="Press Conferences"
        subtitle={`${conferences.length} press conference${conferences.length === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Media", href: `/p/${slug}/media` },
          { label: "Press Conferences" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming" value={fmtIntl.number(upcoming.length)} accent={upcoming.length > 0} />
          <MetricCard label="Scheduled" value={fmtIntl.number(conferences.length)} />
          <MetricCard label="Past" value={fmtIntl.number(conferences.length - upcoming.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Schedule</h3>
          {conferences.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No press conferences scheduled. Producer publishes events containing "press conference" or "media
              briefing" in the name.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {conferences.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {fmt(c.starts_at)} → {fmt(c.ends_at)}
                      {c.location?.name ? ` · ${c.location.name}` : ""}
                    </div>
                    {c.description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{c.description}</p>}
                  </div>
                  <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{toTitle(c.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          To RSVP, email{" "}
          <a className="text-[var(--org-primary)]" href="mailto:press@atlvs.pro">
            press@atlvs.pro
          </a>{" "}
          with your accreditation number and the conference name.
        </p>
      </div>
    </>
  );
}
