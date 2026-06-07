import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.design.eyebrow", undefined, "Venue")}
          title={t("console.venues.design.title", undefined, "Design")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.design.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.venues.design.eyebrow", undefined, "Venue")}
        title={t("console.venues.design.headerTitle", { name: venue.name }, `${venue.name} — Design`)}
        subtitle={
          specs.length === 1
            ? t(
                "console.venues.design.subtitleSingular",
                { count: specs.length, approved },
                `${specs.length} Spec · ${approved} Approved`,
              )
            : t(
                "console.venues.design.subtitlePlural",
                { count: specs.length, approved },
                `${specs.length} Specs · ${approved} Approved`,
              )
        }
        breadcrumbs={[
          { label: t("console.venues.breadcrumb", undefined, "Venues"), href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: t("console.venues.design.title", undefined, "Design") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.venues.design.metric.approved", undefined, "Approved")}
            value={fmt.number(approved)}
            accent
          />
          <MetricCard
            label={t("console.venues.design.metric.inReview", undefined, "In Review")}
            value={fmt.number(inReview)}
          />
          <MetricCard
            label={t("console.venues.design.metric.total", undefined, "Total")}
            value={fmt.number(specs.length)}
          />
        </div>

        {Object.keys(byDiscipline).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.venues.design.byDiscipline", undefined, "By Discipline")}
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {Object.entries(byDiscipline).map(([d, n]) => (
                <li key={d} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--p-text-2)]">{d}</span>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<SpecRow>
          rows={specs}
          emptyLabel={t("console.venues.design.emptyLabel", undefined, "No design specs uploaded")}
          emptyDescription={t(
            "console.venues.design.emptyDescription",
            undefined,
            "Author overlay, seating, signage, broadcast, and rigging specs here. Each row can link to a Bill-of-Materials requisition.",
          )}
          columns={[
            {
              key: "title",
              header: t("console.venues.design.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "discipline",
              header: t("console.venues.design.col.discipline", undefined, "Discipline"),
              render: (r) => <Badge variant="muted">{r.discipline}</Badge>,
              accessor: (r) => r.discipline ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "revision",
              header: t("console.venues.design.col.rev", undefined, "Rev"),
              render: (r) => <span className="font-mono text-xs">{r.revision}</span>,
              accessor: (r) => r.revision ?? null,
            },
            {
              key: "updated",
              header: t("console.venues.design.col.updated", undefined, "Updated"),
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.updated_at)}</span>,
              accessor: (r) => r.updated_at ?? null,
            },
            {
              key: "bom",
              header: t("console.venues.design.col.bom", undefined, "BOM"),
              render: (r) =>
                r.bom_requisition_id ? (
                  <span className="font-mono text-[10px] text-[var(--p-accent)]">
                    {t("console.venues.design.bom.linked", undefined, "linked")}
                  </span>
                ) : (
                  <span className="text-[var(--p-text-2)]">—</span>
                ),
              accessor: (r) => r.bom_requisition_id ?? null,
            },
            {
              key: "status",
              header: t("console.venues.design.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.venues.design.footnote",
            undefined,
            "Specs flow into procurement: link a spec to a requisition and the bill of materials is auto-derived for tendering.",
          )}
        </p>
      </div>
    </>
  );
}
