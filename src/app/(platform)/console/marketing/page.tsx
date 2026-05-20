import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { STATUS_TONE } from "@/lib/marketplace";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  occurs_at: string;
  label: string | null;
  visibility: string;
  talent_offer_id: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketing" title="Overview" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("event_milestones")
    .select("id, kind, occurs_at, label, visibility, talent_offer_id")
    .eq("org_id", session.orgId)
    .gte("occurs_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .order("occurs_at", { ascending: true })
    .limit(200);
  const rows = (data ?? []) as Row[];
  const onsales = rows.filter((r) => r.kind === "onsale").length;
  const presales = rows.filter((r) => r.kind === "presale_start").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Marketing"
        title="Overview"
        subtitle={`${rows.length} upcoming milestone${rows.length === 1 ? "" : "s"}`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="On-sales" value={fmt.number(onsales)} accent />
          <MetricCard label="Presales" value={fmt.number(presales)} />
          <MetricCard label="All Milestones" value={fmt.number(rows.length)} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link href="/console/marketing/onsales" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">On-sales</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Upcoming on-sale dates across all shows.</p>
          </Link>
          <Link href="/console/marketing/calendar" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">Calendar</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Announce, presale, on-sale, sold-out, embargo.</p>
          </Link>
        </div>

        {rows.length > 0 && (
          <section className="surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase">Upcoming</h2>
              <Button href="/console/marketing/calendar" size="sm" variant="ghost">
                View calendar
              </Button>
            </div>
            <ul className="divide-y divide-[var(--border-subtle)]">
              {rows.slice(0, 10).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_TONE[r.kind] ?? "muted"}>{r.kind}</Badge>
                    <span>{r.label ?? "—"}</span>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {fmt.dateTime(r.occurs_at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
