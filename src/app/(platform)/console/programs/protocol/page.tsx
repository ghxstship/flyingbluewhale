import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  code: string;
  name: string;
  color: string | null;
};

type RunRow = {
  id: string;
  scheduled_depart: string;
  scheduled_arrive: string | null;
  status: string;
  origin: { name: string | null } | null;
  destination: { name: string | null } | null;
};

const VIP_CODES = ["VIP", "VVIP", "DIGNITARY", "PROTOCOL", "OFFICIAL", "T3"];

function fmt(iso: string): string {
  return formatDateParts(iso, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Programs" title="Protocol" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const horizon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: catData }, { data: runsData }, { count: blockCount }] = await Promise.all([
    supabase
      .from("accreditation_categories")
      .select("id, code, name, color")
      .eq("org_id", session.orgId)
      .order("code", { ascending: true })
      .limit(100),
    supabase
      .from("dispatch_runs")
      .select(
        "id, scheduled_depart, scheduled_arrive, status, origin:origin_venue_id(name), destination:destination_venue_id(name)",
      )
      .eq("org_id", session.orgId)
      .eq("fleet", "t3")
      .gte("scheduled_depart", new Date().toISOString())
      .lt("scheduled_depart", horizon)
      .order("scheduled_depart", { ascending: true })
      .limit(50),
    supabase.from("accommodation_blocks").select("*", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const allCats = (catData ?? []) as CategoryRow[];
  const vipCats = allCats.filter((c) => VIP_CODES.some((v) => c.code.toUpperCase().includes(v)));
  const runs = (runsData ?? []) as unknown as RunRow[];

  return (
    <>
      <ModuleHeader eyebrow="Programs" title="Protocol" subtitle="VIP itineraries · dignitary management · T3 fleet" />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="VIP categories" value={fmtIntl.number(vipCats.length)} accent />
          <MetricCard label="T3 runs · 14d" value={fmtIntl.number(runs.length)} />
          <MetricCard label="Accommodation Blocks" value={fmtIntl.number(blockCount ?? 0)} />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">VIP accreditation categories</h3>
          {vipCats.length === 0 ? (
            <EmptyState
              size="compact"
              title="No VIP categories defined"
              description="Author categories with codes like VIP, VVIP, DIGNITARY, T3 in Console → Accreditation → Categories."
              action={
                <Link href="/console/accreditation/categories" className="btn btn-secondary btn-sm">
                  Open categories
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {vipCats.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span style={c.color ? { color: c.color } : undefined} className="font-medium">
                    {c.code}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{c.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">T3 fleet — next 14 days</h3>
          {runs.length === 0 ? (
            <EmptyState
              size="compact"
              title="No T3 dispatch runs scheduled"
              description="Author dispatch runs with fleet = 't3' under Transport → Dispatch."
              action={
                <Link href="/console/transport/dispatch/new" className="btn btn-secondary btn-sm">
                  + Schedule run
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {runs.map((r) => (
                <li key={r.id} className="surface flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {r.origin?.name ?? "—"} → {r.destination?.name ?? "—"}
                    </div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">{fmt(r.scheduled_depart)}</div>
                  </div>
                  <Badge variant="muted">{r.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
