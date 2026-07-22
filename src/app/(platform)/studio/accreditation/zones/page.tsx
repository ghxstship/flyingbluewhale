import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ZoneRow = {
  id: string;
  code: string;
  name: string;
  parent_zone_id: string | null;
  venue: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.accreditation.zones.eyebrow", undefined, "Accreditation")}
          title={t("console.accreditation.zones.title", undefined, "Zones")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accreditation.zones.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_zones")
    .select("id, code, name, parent_zone_id, venue:venue_id(name)")
    .eq("org_id", session.orgId)
    .order("code", { ascending: true })
    .limit(500);
  const rows = ((data ?? []) as unknown as ZoneRow[]).map((z) => ({
    ...z,
    venue_name: z.venue?.name ?? "—",
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.zones.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.zones.title", undefined, "Zones")}
        subtitle={t(
          "console.accreditation.zones.subtitle",
          { count: rows.length, plural: rows.length === 1 ? "" : "s" },
          `${rows.length} zone${rows.length === 1 ? "" : "s"} across all venues`,
        )}
      />
      <div className="page-content">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          emptyLabel={t("console.accreditation.zones.emptyLabel", undefined, "No zones defined")}
          emptyDescription={t(
            "console.accreditation.zones.emptyDescription",
            undefined,
            "Zones are authored per venue. Open a venue and use its Zones tab to add ingress, ops, FOH, BOH, and athlete-only areas.",
          )}
          columns={[
            {
              key: "code",
              header: t("console.accreditation.zones.columns.code", undefined, "Code"),
              render: (r) => String(r.code ?? "—"),
              mono: true,
              accessor: (r) => r.code ?? null,
            },
            {
              key: "name",
              header: t("console.accreditation.zones.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "venue",
              header: t("console.accreditation.zones.columns.venue", undefined, "Venue"),
              render: (r) => String(r.venue_name ?? "—"),
              accessor: (r) => r.venue_name ?? null,
            },
            {
              key: "parent_zone_id",
              header: t("console.accreditation.zones.columns.parent", undefined, "Parent"),
              render: (r) => (r.parent_zone_id ? `${String(r.parent_zone_id).slice(0, 8)}…` : "—"),
              mono: true,
              accessor: (r) => r.parent_zone_id ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
