import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type VenueRow = { id: string; name: string };
type SpecRow = {
  id: string;
  title: string;
  discipline: string;
  revision: string;
  status: string;
  notes: string | null;
  file_path: string | null;
  bom_requisition_id: string | null;
  updated_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  draft: "muted",
  in_review: "info",
  approved: "success",
  archived: "warning",
};

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venue" title="Design" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: venueData }, { data: specData }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("venue_design_specs")
      .select("id, title, discipline, revision, status, notes, file_path, bom_requisition_id, updated_at")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("updated_at", { ascending: false }),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const specs = ((specData ?? []) as unknown as SpecRow[]) ?? [];

  const approved = specs.filter((s) => s.status === "approved").length;
  const inReview = specs.filter((s) => s.status === "in_review").length;
  const byDiscipline = specs.reduce<Record<string, number>>((acc, s) => {
    acc[s.discipline] = (acc[s.discipline] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow="Venue"
        title={`${venue.name} — Design`}
        subtitle={`${specs.length} Spec${specs.length === 1 ? "" : "s"} · ${approved} Approved`}
        breadcrumbs={[
          { label: "Venues", href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: "Design" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Approved" value={fmt.number(approved)} accent />
          <MetricCard label="In Review" value={fmt.number(inReview)} />
          <MetricCard label="Total" value={fmt.number(specs.length)} />
        </div>

        {Object.keys(byDiscipline).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">By Discipline</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {Object.entries(byDiscipline).map(([d, n]) => (
                <li key={d} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{d}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<SpecRow>
          rows={specs}
          emptyLabel="No design specs uploaded"
          emptyDescription="Author overlay, seating, signage, broadcast, and rigging specs here. Each row can link to a Bill-of-Materials requisition."
          columns={[
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "discipline",
              header: "Discipline",
              render: (r) => <Badge variant="muted">{r.discipline}</Badge>,
              accessor: (r) => r.discipline ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "revision",
              header: "Rev",
              render: (r) => <span className="font-mono text-xs">{r.revision}</span>,
              accessor: (r) => r.revision ?? null,
            },
            {
              key: "updated",
              header: "Updated",
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.updated_at)}</span>,
              accessor: (r) => r.updated_at ?? null,
            },
            {
              key: "bom",
              header: "BOM",
              render: (r) =>
                r.bom_requisition_id ? (
                  <span className="font-mono text-[10px] text-[var(--org-primary)]">linked</span>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                ),
              accessor: (r) => r.bom_requisition_id ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--text-muted)]">
          Specs flow into procurement: link a spec to a requisition and the bill of materials is auto-derived for
          tendering.
        </p>
      </div>
    </>
  );
}
