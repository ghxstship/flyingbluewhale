import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type VenueRow = { id: string; name: string };
type ItemRow = {
  id: string;
  category: string;
  description: string;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
};

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.closeout.eyebrow", undefined, "Venue")}
          title={t("console.venues.closeout.title", undefined, "Closeout")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.closeout.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    return fmt.dateParts(iso, { month: "short", day: "numeric" });
  }
  const [{ data: venueData }, { data: itemData }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("venue_closeout_items")
      .select("id, category, description, status:item_state, due_at, completed_at, notes")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("item_state", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false }),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const items = ((itemData ?? []) as unknown as ItemRow[]) ?? [];

  const complete = items.filter((i) => i.status === "complete" || i.status === "waived").length;
  const open = items.filter((i) => ["open", "in_progress", "blocked"].includes(i.status)).length;
  const pct = items.length > 0 ? Math.round((complete / items.length) * 100) : 0;

  // Group by category
  const byCategory = items.reduce<Record<string, { total: number; done: number }>>((acc, i) => {
    const slot = acc[i.category] ?? { total: 0, done: 0 };
    slot.total += 1;
    if (i.status === "complete" || i.status === "waived") slot.done += 1;
    acc[i.category] = slot;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.closeout.eyebrow", undefined, "Venue")}
        title={t("console.venues.closeout.headerTitle", { name: venue.name }, `${venue.name} · Closeout`)}
        subtitle={t(
          "console.venues.closeout.subtitle",
          { count: items.length, itemWord: items.length === 1 ? "Item" : "Items", done: complete },
          `${items.length} Item${items.length === 1 ? "" : "s"} · ${complete} Done`,
        )}
        breadcrumbs={[
          { label: t("console.venues.breadcrumb", undefined, "Venues"), href: "/studio/venues" },
          { label: venue.name, href: `/studio/venues/${venue.id}` },
          { label: t("console.venues.closeout.title", undefined, "Closeout") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.venues.closeout.metric.complete", undefined, "Complete")}
            value={fmt.number(complete)}
            accent
          />
          <MetricCard label={t("console.venues.closeout.metric.open", undefined, "Open")} value={fmt.number(open)} />
          <MetricCard
            label={t("console.venues.closeout.metric.total", undefined, "Total")}
            value={fmt.number(items.length)}
          />
        </div>

        {items.length > 0 && (
          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("console.venues.closeout.progress", undefined, "Closeout Progress")}
              </h3>
              <span className="font-mono text-xs">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="mt-3" />

            {Object.keys(byCategory).length > 0 && (
              <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {Object.entries(byCategory).map(([cat, stats]) => (
                  <li key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--p-text-2)]">{cat}</span>
                    <span className="font-mono text-xs text-[var(--p-text-2)]">
                      {stats.done}/{stats.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <DataTable<ItemRow>
          rows={items}
          emptyLabel={t("console.venues.closeout.emptyLabel", undefined, "No closeout items yet")}
          emptyDescription={t(
            "console.venues.closeout.emptyDescription",
            undefined,
            "Demob, reinstatement, asset return, damage, waste, documentation, and financial reconciliation. Author each item with an owner and due date.",
          )}
          columns={[
            {
              key: "category",
              header: t("console.venues.closeout.column.category", undefined, "Category"),
              render: (r) => <Badge variant="muted">{toTitle(r.category)}</Badge>,
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "desc",
              header: t("console.venues.closeout.column.item", undefined, "Item"),
              render: (r) => r.description,
              accessor: (r) => r.description,
            },
            {
              key: "due",
              header: t("console.venues.closeout.column.due", undefined, "Due"),
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_at)}</span>,
              accessor: (r) => r.due_at ?? null,
            },
            {
              key: "completed",
              header: t("console.venues.closeout.column.completed", undefined, "Completed"),
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.completed_at)}</span>,
              accessor: (r) => r.completed_at ?? null,
            },
            {
              key: "status",
              header: t("console.venues.closeout.column.status", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
