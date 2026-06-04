import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
          eyebrow={t("p.delegation.accommodation.eyebrowShort", undefined, "Portal")}
          title={t("p.delegation.accommodation.title", undefined, "Accommodation")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.delegation.accommodation.configureSupabase", undefined, "Configure Supabase.")}
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
    .order("starts_on", { ascending: true, nullsFirst: false });

  const blocks = ((data ?? []) as unknown as Block[]) ?? [];
  const reserved = blocks.reduce((s, b) => s + b.rooms_reserved, 0);
  const confirmed = blocks.reduce((s, b) => s + b.rooms_confirmed, 0);
  const pct = reserved > 0 ? Math.round((confirmed / reserved) * 100) : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.delegation.accommodation.eyebrow", undefined, "Portal · Delegation")}
        title={t("p.delegation.accommodation.title", undefined, "Accommodation")}
        subtitle={
          blocks.length === 1
            ? t(
                "p.delegation.accommodation.subtitleOne",
                { confirmed, reserved },
                `${blocks.length} Block · ${confirmed}/${reserved} rooms confirmed`,
              )
            : t(
                "p.delegation.accommodation.subtitleMany",
                { count: blocks.length, confirmed, reserved },
                `${blocks.length} Blocks · ${confirmed}/${reserved} rooms confirmed`,
              )
        }
        breadcrumbs={[
          { label: t("p.delegation.accommodation.crumbPortal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.delegation.accommodation.crumbDelegation", undefined, "Delegation"),
            href: `/p/${slug}/delegation`,
          },
          { label: t("p.delegation.accommodation.title", undefined, "Accommodation") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.delegation.accommodation.metricConfirmed", undefined, "Confirmed")}
            value={fmtIntl.number(confirmed)}
            accent
          />
          <MetricCard
            label={t("p.delegation.accommodation.metricReserved", undefined, "Reserved")}
            value={fmtIntl.number(reserved)}
          />
          <MetricCard
            label={t("p.delegation.accommodation.metricBlocks", undefined, "Blocks")}
            value={fmtIntl.number(blocks.length)}
          />
        </div>

        {reserved > 0 && (
          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("p.delegation.accommodation.confirmationRate", undefined, "Confirmation Rate")}
              </h3>
              <span className="font-mono text-xs">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="mt-3" />
          </section>
        )}

        <DataTable<Block>
          rows={blocks}
          emptyLabel={t("p.delegation.accommodation.emptyLabel", undefined, "No accommodation blocks")}
          emptyDescription={t(
            "p.delegation.accommodation.emptyDescription",
            undefined,
            "Hotel and athletes' village blocks land here once contracted. Each block tracks reserved vs confirmed rooms.",
          )}
          columns={[
            {
              key: "name",
              header: t("p.delegation.accommodation.colBlock", undefined, "Block"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "property",
              header: t("p.delegation.accommodation.colProperty", undefined, "Property"),
              render: (r) => r.property,
              accessor: (r) => r.property,
            },
            {
              key: "city",
              header: t("p.delegation.accommodation.colCity", undefined, "City"),
              render: (r) => r.city ?? "—",
              accessor: (r) => r.city ?? null,
            },
            {
              key: "rooms",
              header: t("p.delegation.accommodation.colRooms", undefined, "Rooms"),
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.rooms_confirmed}/{r.rooms_reserved}
                </span>
              ),
              accessor: (r) => Number(r.rooms_confirmed ?? 0),
            },
            {
              key: "window",
              header: t("p.delegation.accommodation.colWindow", undefined, "Window"),
              render: (r) => (
                <span className="font-mono text-[10px]">
                  {fmt(r.starts_on)} – {fmt(r.ends_on)}
                </span>
              ),
              accessor: (r) => r.starts_on ?? null,
            },
            {
              key: "group",
              header: t("p.delegation.accommodation.colGroup", undefined, "Group"),
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
