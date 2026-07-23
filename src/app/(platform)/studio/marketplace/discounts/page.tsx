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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Sales" title="Discounts" />
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
        eyebrow="Sales"
        title="Discounts"
        subtitle={rows.length === 1 ? "1 code" : `${rows.length} codes`}
        breadcrumbs={[{ label: "Marketplace", href: "/studio/marketplace" }, { label: "Discounts" }]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/marketplace/discounts/promoters" size="sm" variant="secondary">
              Promoters
            </Button>
            <Button href="/studio/marketplace/discounts/new">+ New Code</Button>
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
              header: "Code",
              render: (r) => r.code,
              mono: true,
              accessor: (r) => r.code,
            },
            {
              key: "value",
              header: "Value",
              render: (r) => formatDiscountValue(r.kind, r.value),
              accessor: (r) => r.value,
            },
            {
              key: "redemptions",
              header: "Redemptions",
              render: (r) =>
                r.max_redemptions && r.max_redemptions > 0
                  ? `${r.redeemed_count} / ${r.max_redemptions}${
                      isRedemptionExhausted(r.max_redemptions, r.redeemed_count) ? " (full)" : ""
                    }`
                  : `${r.redeemed_count} / ∞`,
              accessor: (r) => r.redeemed_count,
            },
            {
              key: "state",
              header: "Status",
              render: (r) => <StatusBadge status={r.discount_state} />,
              accessor: (r) => r.discount_state,
            },
            {
              key: "created",
              header: "Added",
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
