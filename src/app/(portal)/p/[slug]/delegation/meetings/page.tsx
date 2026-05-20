import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: { name: string | null } | null;
};

const MEETING_PATTERN = /(meeting|chef[- ]de[- ]mission|cdm|technical brief|attaché|attache|delegation brief)/i;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Meetings" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const fmt = (iso: string) => fmtIntl.dateTime(iso);
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(200);

  const meetings = ((data ?? []) as unknown as EventRow[]).filter((e) => MEETING_PATTERN.test(e.name));
  const upcoming = meetings.filter((m) => new Date(m.starts_at).getTime() >= Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Delegation"
        title="Meetings"
        subtitle={`${meetings.length} meeting${meetings.length === 1 ? "" : "s"} · ${upcoming.length} upcoming`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Delegation", href: `/p/${slug}/delegation` },
          { label: "Meetings" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming" value={fmtIntl.number(upcoming.length)} accent={upcoming.length > 0} />
          <MetricCard label="Total" value={fmtIntl.number(meetings.length)} />
          <MetricCard label="Past" value={fmtIntl.number(meetings.length - upcoming.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Schedule</h3>
          {meetings.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No meetings scheduled.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {meetings.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{m.name}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {fmt(m.starts_at)}
                      {m.location?.name ? ` · ${m.location.name}` : ""}
                    </div>
                  </div>
                  <Badge variant={m.status === "complete" ? "muted" : "info"}>{m.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
