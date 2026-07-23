import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import { formatBps } from "@/lib/discounts_promoters";

export const dynamic = "force-dynamic";

type PromoterRow = {
  id: string;
  name: string;
  email: string | null;
  commission_bps: number;
  ref_code: string | null;
  promoter_state: string;
  created_at: string;
};

export default async function PromotersPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.discounts.eyebrow", undefined, "Sales")}
          title={t("console.marketplace.discounts.promoters", undefined, "Promoters")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("promoters")
    .select("id, name, email, commission_bps, ref_code, promoter_state, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as PromoterRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.discounts.eyebrow", undefined, "Sales")}
        title={t("console.marketplace.discounts.promoters", undefined, "Promoters")}
        subtitle={
          rows.length === 1
            ? t("console.marketplace.discounts.promotersTree.subtitleOne", undefined, "1 affiliate")
            : t(
                "console.marketplace.discounts.promotersTree.subtitleMany",
                { count: rows.length },
                `${rows.length} affiliates`,
              )
        }
        breadcrumbs={[
          {
            label: t("console.marketplace.discounts.breadcrumb.marketplace", undefined, "Marketplace"),
            href: "/studio/marketplace",
          },
          {
            label: t("console.marketplace.discounts.title", undefined, "Discounts"),
            href: "/studio/marketplace/discounts",
          },
          { label: t("console.marketplace.discounts.promoters", undefined, "Promoters") },
        ]}
        action={
          <Button href="/studio/marketplace/discounts/promoters/new">
            {t("console.marketplace.discounts.promotersTree.newPromoter", undefined, "+ New Promoter")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<PromoterRow>
          rows={rows}
          rowHref={(r) => `/studio/marketplace/discounts/promoters/${r.id}`}
          columns={[
            {
              key: "name",
              header: t("console.marketplace.discounts.promotersTree.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "email",
              header: t("console.marketplace.discounts.promotersTree.columns.email", undefined, "Email"),
              render: (r) => r.email ?? "—",
              accessor: (r) => r.email ?? null,
            },
            {
              key: "ref",
              header: t("console.marketplace.discounts.promotersTree.columns.refCode", undefined, "Ref Code"),
              render: (r) => r.ref_code ?? "—",
              mono: true,
              accessor: (r) => r.ref_code ?? null,
            },
            {
              key: "commission",
              header: t("console.marketplace.discounts.promotersTree.columns.commission", undefined, "Commission"),
              render: (r) => formatBps(r.commission_bps),
              accessor: (r) => r.commission_bps,
            },
            {
              key: "state",
              header: t("console.marketplace.discounts.promotersTree.columns.status", undefined, "Status"),
              render: (r) => <StatusBadge status={r.promoter_state} />,
              accessor: (r) => r.promoter_state,
            },
            {
              key: "created",
              header: t("console.marketplace.discounts.promotersTree.columns.added", undefined, "Added"),
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
