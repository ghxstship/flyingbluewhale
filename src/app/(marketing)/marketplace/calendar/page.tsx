import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { STATUS_TONE } from "@/lib/marketplace";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Event Calendar — On-sales + Announces",
  description: "Upcoming on-sale dates, presale windows, and announcements.",
  path: "/marketplace/calendar",
});

type Row = { id: string; kind: string; label: string | null; occurs_at: string; org_name: string; org_slug: string };

export default async function Page() {
  let rows: Row[] = [];
  const fmt = await getRequestFormatters();
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_event_calendar")
      .select("*")
      .order("occurs_at", { ascending: true })
      .limit(120);
    rows = (data ?? []) as Row[];
  }

  const byDay = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const day = r.occurs_at.slice(0, 10);
    (acc[day] ??= []).push(r);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort();

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Calendar" }]} />
      <header>
        <p className="eyebrow">Marketplace · Calendar</p>
        <h1 className="hed-2xl">EVENT CALENDAR</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rows.length} upcoming announcement{rows.length === 1 ? "" : "s"} + on-sale milestone
          {rows.length === 1 ? "" : "s"}
        </p>
      </header>

      {days.length === 0 ? (
        <div className="surface p-6 text-sm text-[var(--text-secondary)]">
          No public milestones in the upcoming window.
        </div>
      ) : (
        days.map((d) => (
          <section key={d} className="surface p-5">
            <h2 className="mb-2 font-mono text-sm text-[var(--text-secondary)]">{fmt.date(d + "T00:00:00", "long")}</h2>
            <ul className="divide-y divide-[var(--border-subtle)]">
              {byDay[d].map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_TONE[r.kind] ?? "muted"}>{r.kind}</Badge>
                    <span>{r.label ?? r.org_name}</span>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {fmt.time(r.occurs_at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
