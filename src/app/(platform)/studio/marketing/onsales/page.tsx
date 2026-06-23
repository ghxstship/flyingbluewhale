import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = { id: string; kind: string; occurs_at: string; label: string | null; visibility: string };

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketing.onsales.eyebrow", undefined, "Marketing")}
          title={t("console.marketing.onsales.title", undefined, "On-sales")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketing.onsales.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_milestones")
    .select("id, kind, occurs_at, label, visibility")
    .eq("org_id", session.orgId)
    .in("kind", ["onsale", "presale_start", "presale_end"])
    .gte("occurs_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .order("occurs_at", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketing.onsales.eyebrow", undefined, "Marketing")}
        title={t("console.marketing.onsales.title", undefined, "On-sales")}
        subtitle={t(
          rows.length === 1 ? "console.marketing.onsales.subtitle.one" : "console.marketing.onsales.subtitle.other",
          { count: rows.length },
          `${rows.length} Upcoming on-sale + presale milestone${rows.length === 1 ? "" : "s"}`,
        )}
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.marketing.onsales.emptyLabel", undefined, "No upcoming on-sales")}
          emptyDescription={t(
            "console.marketing.onsales.emptyDescription",
            undefined,
            "Add an event_milestone with kind onsale / presale_start / presale_end.",
          )}
          columns={[
            {
              key: "kind",
              header: t("console.marketing.onsales.col.kind", undefined, "Kind"),
              render: (r) => <Badge variant="muted">{toTitle(r.kind)}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "label",
              header: t("console.marketing.onsales.col.label", undefined, "Label"),
              render: (r) => r.label ?? "—",
              accessor: (r) => r.label ?? null,
            },
            {
              key: "when",
              header: t("console.marketing.onsales.col.occurs", undefined, "Occurs"),
              render: (r) => new Date(r.occurs_at).toLocaleString(),
              accessor: (r) => r.occurs_at,
              className: "font-mono text-xs",
            },
            {
              key: "vis",
              header: t("console.marketing.onsales.col.visibility", undefined, "Visibility"),
              render: (r) => (
                <Badge variant={r.visibility === "public" ? "success" : r.visibility === "partners" ? "info" : "muted"}>
                  {r.visibility}
                </Badge>
              ),
              accessor: (r) => r.visibility,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
