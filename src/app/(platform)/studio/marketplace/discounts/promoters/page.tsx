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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Sales" title="Promoters" />
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
        eyebrow="Sales"
        title="Promoters"
        subtitle={rows.length === 1 ? "1 affiliate" : `${rows.length} affiliates`}
        breadcrumbs={[
          { label: "Marketplace", href: "/studio/marketplace" },
          { label: "Discounts", href: "/studio/marketplace/discounts" },
          { label: "Promoters" },
        ]}
        action={<Button href="/studio/marketplace/discounts/promoters/new">+ New Promoter</Button>}
      />
      <div className="page-content">
        <DataView<PromoterRow>
          rows={rows}
          rowHref={(r) => `/studio/marketplace/discounts/promoters/${r.id}`}
          columns={[
            {
              key: "name",
              header: "Name",
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "email",
              header: "Email",
              render: (r) => r.email ?? "—",
              accessor: (r) => r.email ?? null,
            },
            {
              key: "ref",
              header: "Ref Code",
              render: (r) => r.ref_code ?? "—",
              mono: true,
              accessor: (r) => r.ref_code ?? null,
            },
            {
              key: "commission",
              header: "Commission",
              render: (r) => formatBps(r.commission_bps),
              accessor: (r) => r.commission_bps,
            },
            {
              key: "state",
              header: "Status",
              render: (r) => <StatusBadge status={r.promoter_state} />,
              accessor: (r) => r.promoter_state,
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
