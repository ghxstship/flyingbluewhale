import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type VenueRow = {
  id: string;
  name: string;
  kind: string;
  cluster: string | null;
  capacity: number | null;
  handover_state: string;
};

const COMPOUND_KINDS = ["ibc", "mpc"] as const;

const KIND_LABEL: Record<string, string> = {
  ibc: "IBC · International Broadcast Centre",
  mpc: "MPC · Main Press Centre",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.compounds.eyebrow", undefined, "Production")}
          title={t("console.production.compounds.title", undefined, "Compounds")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.compounds.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("venues")
    .select("id, name, kind, cluster, capacity, handover_state")
    .eq("org_id", session.orgId)
    .in("kind", [...COMPOUND_KINDS])
    .order("name", { ascending: true })
    .limit(200);
  const rows = (data ?? []) as VenueRow[];

  // Aggregate by kind
  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.compounds.eyebrow", undefined, "Production")}
        title={t("console.production.compounds.title", undefined, "Compounds")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.production.compounds.compound", undefined, "compound") : t("console.production.compounds.compounds", undefined, "compounds")} (${COMPOUND_KINDS.map((k) => `${byKind[k] ?? 0} ${k.toUpperCase()}`).join(" · ")})`}
        action={
          <Button href="/console/venues/new" size="sm">
            {t("console.production.compounds.newVenue", undefined, "+ New Venue")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {Object.keys(byKind).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">{t("console.production.compounds.byKind", undefined, "By Kind")}</h3>
            <ul className="mt-3 space-y-1.5">
              {COMPOUND_KINDS.map((k) => (
                <li key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--p-text-2)]">{KIND_LABEL[k] ?? k}</span>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{byKind[k] ?? 0}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<VenueRow>
          rows={rows}
          rowHref={(r) => `/console/venues/${r.id}`}
          emptyLabel={t("console.production.compounds.emptyLabel", undefined, "No broadcast compounds")}
          emptyDescription={t(
            "console.production.compounds.emptyDescription",
            undefined,
            "Broadcast compounds (IBC + MPC) are venues with kind 'ibc' or 'mpc'. Author one through Venues → New, then set its kind.",
          )}
          emptyAction={
            <Button href="/console/venues/new" size="sm">
              {t("console.production.compounds.newVenue", undefined, "+ New Venue")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.production.compounds.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "kind",
              header: t("console.production.compounds.col.kind", undefined, "Kind"),
              render: (r) => r.kind.toUpperCase(),
              className: "font-mono text-xs",
              filterable: true,
              groupable: true,
              accessor: (r) => r.kind.toUpperCase ?? null,
            },
            {
              key: "cluster",
              header: t("console.production.compounds.col.cluster", undefined, "Cluster"),
              render: (r) => r.cluster ?? "—",
              accessor: (r) => r.cluster ?? null,
            },
            {
              key: "capacity",
              header: t("console.production.compounds.col.capacity", undefined, "Capacity"),
              render: (r) => (
                <span className="font-mono text-xs">{r.capacity != null ? fmt.number(r.capacity) : "—"}</span>
              ),
              accessor: (r) => r.capacity ?? null,
            },
            {
              key: "handover",
              header: t("console.production.compounds.col.handover", undefined, "Handover"),
              render: (r) => <StatusBadge status={r.handover_state} />,
              accessor: (r) => r.handover_state,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.production.compounds.footerNote",
            undefined,
            "Cable plant + signal flow diagrams attach to each venue's stage-plot record. Open a compound to author its rigging plan and rights-holder allocation.",
          )}
        </p>
      </div>
    </>
  );
}
