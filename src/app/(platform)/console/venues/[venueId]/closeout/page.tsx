import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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

const ITEM_TONE: Record<string, "muted" | "info" | "warning" | "success"> = {
  open: "muted",
  in_progress: "info",
  blocked: "warning",
  complete: "success",
  waived: "muted",
};

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venue" title="Closeout" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
      .select("id, category, description, status, due_at, completed_at, notes")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("status", { ascending: true })
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
        eyebrow="Venue"
        title={`${venue.name} — Closeout`}
        subtitle={`${items.length} item${items.length === 1 ? "" : "s"} · ${complete} done`}
        breadcrumbs={[
          { label: "Venues", href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: "Closeout" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Complete" value={fmt.number(complete)} accent />
          <MetricCard label="Open" value={fmt.number(open)} />
          <MetricCard label="Total" value={fmt.number(items.length)} />
        </div>

        {items.length > 0 && (
          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Closeout Progress</h3>
              <span className="font-mono text-xs">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="mt-3" />

            {Object.keys(byCategory).length > 0 && (
              <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {Object.entries(byCategory).map(([cat, stats]) => (
                  <li key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{cat}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
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
          emptyLabel="No closeout items yet"
          emptyDescription="Demob, reinstatement, asset return, damage, waste, documentation, and financial reconciliation. Author each item with an owner and due date."
          columns={[
            {
              key: "category",
              header: "Category",
              render: (r) => <Badge variant="muted">{r.category}</Badge>,
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            { key: "desc", header: "Item", render: (r) => r.description, accessor: (r) => r.description },
            {
              key: "due",
              header: "Due",
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_at)}</span>,
              accessor: (r) => r.due_at ?? null,
            },
            {
              key: "completed",
              header: "Completed",
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.completed_at)}</span>,
              accessor: (r) => r.completed_at ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={ITEM_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status.replace ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
