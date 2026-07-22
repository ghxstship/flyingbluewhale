import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { Crumbs, Fab } from "@/components/mobile/kit";
import { RequisitionsView, type RequisitionItem } from "./RequisitionsView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Requisitions — what you've asked the org to buy.
 *
 * Scoped to the viewer, deliberately. RLS on `requisitions` is org-level,
 * so it is no backstop for a personal surface — the same shape as D6/D16,
 * where "My Tasks" showed 201 tasks of which 2 were the viewer's. A manager
 * reviewing the org's requisitions does that on the console, which is built
 * for it.
 *
 * Kit 34: the list renders through the shared view engine (`RequisitionsView`
 * → `NormalizedList`) — search + View Options / Share & Export + list/table/
 * board. The DB read below is unchanged (same table/columns/scope).
 */
export default async function RequisitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ warn?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }

  // The PO form redirects here with ?warn= when the request landed but its
  // quote didn't — this page dropped that message on the floor.
  const { warn } = await searchParams;

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents, requisition_state, created_at")
    .eq("org_id", session.orgId)
    .eq("requester_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];

  const items: RequisitionItem[] = rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    requisition_state: r.requisition_state as string,
    estimatedCents: r.estimated_cents != null ? (r.estimated_cents as number) : null,
    estimatedLabel: r.estimated_cents != null ? fmt.money(r.estimated_cents as number) : null,
    createdLabel: fmt.relative(r.created_at as string),
  }));

  return (
    <div className="screen screen-anim">
      {/* Kit 32 C1: the finance → PO record path gets its trail. */}
      <Crumbs
        items={[
          { label: t("m.reqs.crumbMore", undefined, "More"), href: "/m/more" },
          { label: t("m.finance.title", undefined, "Finance"), href: "/m/finance" },
          { label: t("m.reqs.title", undefined, "Purchase Requests") },
        ]}
      />
      <div className="scr-eye">
        {rows.length === 1
          ? t("m.reqs.eyebrowOne", undefined, "1 Request")
          : t("m.reqs.eyebrow", { count: rows.length }, `${rows.length} Requests`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.reqs.title", undefined, "Purchase Requests")}
      </h1>

      {warn && (
        <div className="ps-alert ps-alert--warn" role="status" style={{ marginBottom: 12 }}>
          {warn}
        </div>
      )}

      <RequisitionsView items={items} />

      {/* Kit-29 spec: FAB = New Requisition. */}
      <Fab href="/m/requisitions/new" label={t("m.requisitions.newCta", undefined, "Request A Purchase")} />
    </div>
  );
}
