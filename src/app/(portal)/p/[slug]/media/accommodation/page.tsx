import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Block = {
  id: string;
  name: string;
  property: string;
  city: string | null;
  rooms_reserved: number;
  rooms_confirmed: number;
  starts_on: string | null;
  ends_on: string | null;
  stakeholder_group: string | null;
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Media Accommodation" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Media-tagged accommodation blocks.
  const { data } = await supabase
    .from("accommodation_blocks")
    .select("id, name, property, city, rooms_reserved, rooms_confirmed, starts_on, ends_on, stakeholder_group")
    .eq("org_id", session.orgId)
    .eq("stakeholder_group", "media")
    .order("starts_on", { ascending: true, nullsFirst: false });

  const blocks = ((data ?? []) as unknown as Block[]) ?? [];
  const reserved = blocks.reduce((s, b) => s + b.rooms_reserved, 0);
  const confirmed = blocks.reduce((s, b) => s + b.rooms_confirmed, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Media"
        title="Accommodation"
        subtitle={`${blocks.length} block${blocks.length === 1 ? "" : "s"} · ${confirmed}/${reserved} rooms`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Media", href: `/p/${slug}/media` },
          { label: "Accommodation" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Confirmed" value={confirmed.toLocaleString()} accent />
          <MetricCard label="Reserved" value={reserved.toLocaleString()} />
          <MetricCard label="Blocks" value={blocks.length.toLocaleString()} />
        </div>

        <DataTable<Block>
          rows={blocks}
          emptyLabel="No media accommodation blocks"
          emptyDescription="Media hotel blocks land here once contracted. Each block is tagged with stakeholder_group = media."
          columns={[
            { key: "name", header: "Block", render: (r) => r.name, accessor: (r) => r.name },
            { key: "property", header: "Property", render: (r) => r.property, accessor: (r) => r.property },
            { key: "city", header: "City", render: (r) => r.city ?? "—", accessor: (r) => r.city ?? null },
            {
              key: "rooms",
              header: "Rooms",
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.rooms_confirmed}/{r.rooms_reserved}
                </span>
              ),
            },
            {
              key: "window",
              header: "Window",
              render: (r) => (
                <span className="font-mono text-[10px]">
                  {fmt(r.starts_on)} – {fmt(r.ends_on)}
                </span>
              ),
            },
            {
              key: "group",
              header: "Group",
              render: (r) => (r.stakeholder_group ? <Badge variant="muted">{r.stakeholder_group}</Badge> : "—"),
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
