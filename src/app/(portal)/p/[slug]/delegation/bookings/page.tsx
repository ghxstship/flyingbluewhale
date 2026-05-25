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

type Booking = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: { name: string | null } | null;
};

const TRAIN_PATTERN = /(training|practice|warm[- ]?up|drill)/i;

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
        <ModuleHeader eyebrow="Portal" title="Training Bookings" />
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

  const bookings = ((data ?? []) as unknown as Booking[]).filter((b) => TRAIN_PATTERN.test(b.name));
  const upcoming = bookings.filter((b) => new Date(b.starts_at).getTime() >= Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Delegation"
        title="Training Bookings"
        subtitle={`${bookings.length} Booking${bookings.length === 1 ? "" : "s"} · ${upcoming.length} Upcoming`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Delegation", href: `/p/${slug}/delegation` },
          { label: "Bookings" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming" value={fmtIntl.number(upcoming.length)} accent={upcoming.length > 0} />
          <MetricCard label="Total" value={fmtIntl.number(bookings.length)} />
          <MetricCard label="Past" value={fmtIntl.number(bookings.length - upcoming.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Bookings</h3>
          {bookings.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No training bookings yet. Submit a request via your delegation lead.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{b.name}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {fmt(b.starts_at)} → {fmt(b.ends_at)}
                      {b.location?.name ? ` · ${b.location.name}` : ""}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[b.status] ?? "muted"}>{toTitle(b.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
