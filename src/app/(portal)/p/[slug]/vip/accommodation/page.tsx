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
          eyebrow={t("p.vip.accommodation.eyebrowShort", undefined, "Portal")}
          title={t("p.vip.accommodation.titleFull", undefined, "VIP Accommodation")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.vip.accommodation.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("accommodation_blocks")
    .select("id, name, property, city, rooms_reserved, rooms_confirmed, starts_on, ends_on, stakeholder_group")
    .eq("org_id", session.orgId)
    .eq("stakeholder_group", "vip")
    .order("starts_on", { ascending: true, nullsFirst: false });

  const blocks = ((data ?? []) as unknown as Block[]) ?? [];
  const reserved = blocks.reduce((s, b) => s + b.rooms_reserved, 0);
  const confirmed = blocks.reduce((s, b) => s + b.rooms_confirmed, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.vip.accommodation.eyebrow", undefined, "Portal · VIP")}
        title={t("p.vip.accommodation.title", undefined, "Accommodation")}
        subtitle={
          blocks.length === 1
            ? t(
                "p.vip.accommodation.subtitle.one",
                { count: blocks.length, confirmed, reserved },
                `${blocks.length} Block · ${confirmed}/${reserved} suites`,
              )
            : t(
                "p.vip.accommodation.subtitle.other",
                { count: blocks.length, confirmed, reserved },
                `${blocks.length} Blocks · ${confirmed}/${reserved} suites`,
              )
        }
        breadcrumbs={[
          { label: t("p.vip.accommodation.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.vip.accommodation.breadcrumb.vip", undefined, "VIP"), href: `/p/${slug}/vip` },
          { label: t("p.vip.accommodation.breadcrumb.accommodation", undefined, "Accommodation") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.vip.accommodation.metric.confirmed", undefined, "Confirmed")}
            value={fmtIntl.number(confirmed)}
            accent
          />
          <MetricCard
            label={t("p.vip.accommodation.metric.reserved", undefined, "Reserved")}
            value={fmtIntl.number(reserved)}
          />
          <MetricCard
            label={t("p.vip.accommodation.metric.properties", undefined, "Properties")}
            value={fmtIntl.number(blocks.length)}
          />
        </div>

        <DataView<Block>
          rows={blocks}
          emptyLabel={t("p.vip.accommodation.empty.label", undefined, "No VIP accommodation")}
          emptyDescription={t(
            "p.vip.accommodation.empty.description",
            undefined,
            "VIP suite reservations land here once contracted with stakeholder_group = vip.",
          )}
          columns={[
            {
              key: "name",
              header: t("p.vip.accommodation.col.block", undefined, "Block"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "property",
              header: t("p.vip.accommodation.col.property", undefined, "Property"),
              render: (r) => r.property,
              accessor: (r) => r.property,
            },
            {
              key: "city",
              header: t("p.vip.accommodation.col.city", undefined, "City"),
              render: (r) => r.city ?? "—",
              accessor: (r) => r.city ?? null,
            },
            {
              key: "rooms",
              header: t("p.vip.accommodation.col.suites", undefined, "Suites"),
              render: (r) => `${r.rooms_confirmed}/${r.rooms_reserved}`,
              mono: true,
              accessor: (r) => Number(r.rooms_confirmed ?? 0),
            },
            {
              key: "window",
              header: t("p.vip.accommodation.col.window", undefined, "Window"),
              render: (r) => `${fmt(r.starts_on)} – ${fmt(r.ends_on)}`,
              mono: true,
              accessor: (r) => r.starts_on ?? null,
            },
            {
              key: "group",
              header: t("p.vip.accommodation.col.group", undefined, "Group"),
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
