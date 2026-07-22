import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.media.accommodation.eyebrowShort", undefined, "Portal")}
          title={t("p.media.accommodation.titleFull", undefined, "Media Accommodation")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.media.accommodation.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
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
        eyebrow={t("p.media.accommodation.eyebrow", undefined, "Portal · Media")}
        title={t("p.media.accommodation.title", undefined, "Accommodation")}
        subtitle={t(
          "p.media.accommodation.subtitle",
          { count: blocks.length, blockLabel: blocks.length === 1 ? "Block" : "Blocks", confirmed, reserved },
          `${blocks.length} Block${blocks.length === 1 ? "" : "s"} · ${confirmed}/${reserved} rooms`,
        )}
        breadcrumbs={[
          { label: t("p.media.accommodation.crumbs.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.media.accommodation.crumbs.media", undefined, "Media"), href: `/p/${slug}/media` },
          { label: t("p.media.accommodation.crumbs.accommodation", undefined, "Accommodation") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.media.accommodation.metrics.confirmed", undefined, "Confirmed")}
            value={fmtIntl.number(confirmed)}
            accent
          />
          <MetricCard
            label={t("p.media.accommodation.metrics.reserved", undefined, "Reserved")}
            value={fmtIntl.number(reserved)}
          />
          <MetricCard
            label={t("p.media.accommodation.metrics.blocks", undefined, "Blocks")}
            value={fmtIntl.number(blocks.length)}
          />
        </div>

        <DataView<Block>
          rows={blocks}
          emptyLabel={t("p.media.accommodation.empty.label", undefined, "No media accommodation blocks")}
          emptyDescription={t(
            "p.media.accommodation.empty.description",
            undefined,
            "Media hotel blocks land here once contracted. Each block is tagged with stakeholder_group = media.",
          )}
          columns={[
            {
              key: "name",
              header: t("p.media.accommodation.columns.block", undefined, "Block"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "property",
              header: t("p.media.accommodation.columns.property", undefined, "Property"),
              render: (r) => r.property,
              accessor: (r) => r.property,
            },
            {
              key: "city",
              header: t("p.media.accommodation.columns.city", undefined, "City"),
              render: (r) => r.city ?? "—",
              accessor: (r) => r.city ?? null,
            },
            {
              key: "rooms",
              header: t("p.media.accommodation.columns.rooms", undefined, "Rooms"),
              render: (r) => `${r.rooms_confirmed}/${r.rooms_reserved}`,
              mono: true,
              accessor: (r) => Number(r.rooms_confirmed ?? 0),
            },
            {
              key: "window",
              header: t("p.media.accommodation.columns.window", undefined, "Window"),
              render: (r) => `${fmt(r.starts_on)} – ${fmt(r.ends_on)}`,
              mono: true,
              accessor: (r) => r.starts_on ?? null,
            },
            {
              key: "group",
              header: t("p.media.accommodation.columns.group", undefined, "Group"),
              render: (r) => (r.stakeholder_group ? <Badge variant="muted">{r.stakeholder_group}</Badge> : "—"),
              filterable: true,
              groupable: true,
              accessor: (r) => r.stakeholder_group ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
