import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Volunteer" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: meRows }] = await Promise.all([
    supabase
      .from("workforce_members")
      .select("id, full_name, role, kind, venue_id")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .eq("kind", "volunteer")
      .limit(1),
  ]);

  const me = (meRows ?? [])[0] as
    | { id: string; full_name: string; role: string | null; venue_id: string | null }
    | undefined;
  let upcomingShifts = 0;
  if (me) {
    const { count } = await supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("workforce_member_id", me.id)
      .gte("starts_at", new Date().toISOString());
    upcomingShifts = count ?? 0;
  }

  const tiles = [
    { href: `/p/${slug}/volunteer/application`, label: "Application", desc: "Status of your volunteer application" },
    { href: `/p/${slug}/volunteer/schedule`, label: "Schedule", desc: "Your upcoming shifts" },
    { href: `/p/${slug}/volunteer/training`, label: "Training", desc: "Required modules and certificates" },
    { href: `/p/${slug}/volunteer/uniform`, label: "Uniform", desc: "Pickup details and sizing" },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="Portal"
        title="Volunteer"
        subtitle={me ? `Welcome, ${me.full_name}${me.role ? ` · ${me.role}` : ""}` : "Volunteer dashboard"}
        breadcrumbs={[{ label: "Portal", href: `/p/${slug}` }, { label: "Volunteer" }]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming Shifts" value={fmt.number(upcomingShifts)} accent={upcomingShifts > 0} />
          <MetricCard label="Status" value={me ? "Active" : "Pending"} />
          <MetricCard label="Role" value={me?.role ?? "—"} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.label}</div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{t.desc}</p>
            </Link>
          ))}
        </div>
        {!me && (
          <div className="surface p-4 text-xs text-[var(--text-muted)]">
            <Badge variant="warning">Not yet onboarded</Badge> Submit your application via the Application tile to get
            scheduled.
          </div>
        )}
      </div>
    </>
  );
}
