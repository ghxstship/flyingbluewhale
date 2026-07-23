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
import { formatDiscountValue, isRedemptionExhausted, type DiscountKind } from "@/lib/discounts_promoters";

export const dynamic = "force-dynamic";

type DiscountRow = {
  id: string;
  code: string;
  kind: DiscountKind;
  value: number;
  max_redemptions: number | null;
  redeemed_count: number;
  discount_state: string;
  created_at: string;
};

export default async function DiscountsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.discounts.eyebrow", undefined, "Sales")}
          title={t("console.marketplace.discounts.title", undefined, "Discounts")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("discount_codes")
    .select("id, code, kind, value, max_redemptions, redeemed_count, discount_state, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as DiscountRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.discounts.eyebrow", undefined, "Sales")}
        title={t("console.marketplace.discounts.title", undefined, "Discounts")}
        subtitle={
          rows.length === 1
            ? t("console.marketplace.discounts.subtitleOne", undefined, "1 code")
            : t("console.marketplace.discounts.subtitleMany", { count: rows.length }, `${rows.length} codes`)
        }
        breadcrumbs={[
          {
            label: t("console.marketplace.discounts.breadcrumb.marketplace", undefined, "Marketplace"),
            href: "/studio/marketplace",
          },
          { label: t("console.marketplace.discounts.title", undefined, "Discounts") },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/marketplace/discounts/promoters" size="sm" variant="secondary">
              {t("console.marketplace.discounts.promoters", undefined, "Promoters")}
            </Button>
            <Button href="/studio/marketplace/discounts/new">
              {t("console.marketplace.discounts.newCode", undefined, "+ New Code")}
            </Button>
          </div>
        }
      />
      <div className="page-content">
        <DataView<DiscountRow>
          rows={rows}
          rowHref={(r) => `/studio/marketplace/discounts/${r.id}`}
          columns={[
            {
              key: "code",
              header: t("console.marketplace.discounts.columns.code", undefined, "Code"),
              render: (r) => r.code,
              mono: true,
              accessor: (r) => r.code,
            },
            {
              key: "value",
              header: t("console.marketplace.discounts.columns.value", undefined, "Value"),
              render: (r) => formatDiscountValue(r.kind, r.value),
              accessor: (r) => r.value,
            },
            {
              key: "redemptions",
              header: t("console.marketplace.discounts.columns.redemptions", undefined, "Redemptions"),
              render: (r) =>
                r.max_redemptions && r.max_redemptions > 0
                  ? `${r.redeemed_count} / ${r.max_redemptions}${
                      isRedemptionExhausted(r.max_redemptions, r.redeemed_count)
                        ? t("console.marketplace.discounts.fullSuffix", undefined, " (full)")
                        : ""
                    }`
                  : `${r.redeemed_count} / ∞`,
              accessor: (r) => r.redeemed_count,
            },
            {
              key: "state",
              header: t("console.marketplace.discounts.columns.status", undefined, "Status"),
              render: (r) => <StatusBadge status={r.discount_state} />,
              accessor: (r) => r.discount_state,
            },
            {
              key: "created",
              header: t("console.marketplace.discounts.columns.added", undefined, "Added"),
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
