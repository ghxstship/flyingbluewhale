import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

/**
 * Promoter portal settlements — show-night reconciliation for the
 * caller's co-pro deal. Reads `settlements` filtered to the project.
 * RLS gates org membership; co-pro splits live on `talent_offers`
 * (split percentage on the deal).
 */

type Settlement = {
  id: string;
  show_date: string;
  gross_box_office_cents: number;
  paid_attendance: number;
  comp_count: number;
  artist_payout_cents: number;
  balance_due_cents: number;
  status: string;
  finalized_at: string | null;
  currency: string;
};

export default async function PromoterSettlements({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  // Settlements aren't directly linked to projects — they're linked via
  // talent_offers.event_id → events.project_id. Two-step join works
  // without a view because there are few settlements per project.
  const { data: offers } = project
    ? await supabase.from("talent_offers").select("id, event:event_id(project_id)").eq("org_id", session.orgId)
    : { data: [] };
  const offerIds = ((offers ?? []) as unknown as Array<{ id: string; event: { project_id: string } | null }>)
    .filter((o) => o.event?.project_id === project?.id)
    .map((o) => o.id);

  const { data } = offerIds.length
    ? await supabase
        .from("settlements")
        .select(
          "id, show_date, gross_box_office_cents, paid_attendance, comp_count, artist_payout_cents, balance_due_cents, status, finalized_at, currency",
        )
        .eq("org_id", session.orgId)
        .in("talent_offer_id", offerIds)
        .order("show_date", { ascending: false })
    : { data: [] as Settlement[] };
  const rows = (data ?? []) as Settlement[];

  const totalGross = rows.reduce((a, r) => a + (r.gross_box_office_cents ?? 0), 0);
  const totalPaid = rows.reduce((a, r) => a + (r.paid_attendance ?? 0), 0);

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "promoter")} title="Promoter" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Settlements</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Show-night reconciliation across this co-pro engagement. {rows.length} show
          {rows.length === 1 ? "" : "s"} settled.
        </p>

        <section className="mt-5 grid grid-cols-3 gap-2">
          <div className="surface p-3">
            <div className="font-mono text-2xl font-semibold">
              {(totalGross / 100).toLocaleString("en-US", { style: "currency", currency: rows[0]?.currency ?? "USD" })}
            </div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Total Gross</div>
          </div>
          <div className="surface p-3">
            <div className="font-mono text-2xl font-semibold">{fmt.number(totalPaid)}</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Paid Attendance</div>
          </div>
          <div className="surface p-3">
            <div className="font-mono text-2xl font-semibold">{rows.filter((r) => r.status === "final").length}</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Finalized</div>
          </div>
        </section>

        <table className="data-table mt-6 w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Gross</th>
              <th>Paid</th>
              <th>Comps</th>
              <th>Artist Payout</th>
              <th>Balance Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    size="compact"
                    title="No Settlements Yet"
                    description="Settled show-night numbers will appear here once ops closes the books."
                  />
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{fmt.date(s.show_date)}</td>
                  <td className="font-mono text-xs">
                    {(s.gross_box_office_cents / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: s.currency,
                    })}
                  </td>
                  <td className="font-mono text-xs">{fmt.number(s.paid_attendance)}</td>
                  <td className="font-mono text-xs">{fmt.number(s.comp_count)}</td>
                  <td className="font-mono text-xs">
                    {(s.artist_payout_cents / 100).toLocaleString("en-US", { style: "currency", currency: s.currency })}
                  </td>
                  <td className="font-mono text-xs">
                    {(s.balance_due_cents / 100).toLocaleString("en-US", { style: "currency", currency: s.currency })}
                  </td>
                  <td>
                    <Badge variant={s.status === "final" ? "success" : "info"}>{s.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
