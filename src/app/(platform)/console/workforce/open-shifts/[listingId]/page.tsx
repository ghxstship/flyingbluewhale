import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { CLAIM_STATE_TONE, LISTING_STATE_TONE, formatPayRate, formatShiftWindow } from "@/lib/open-shifts";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { decideClaimAction, cancelListingAction } from "./actions";

export const dynamic = "force-dynamic";

type ClaimRow = {
  id: string;
  user_name: string;
  claim_state: string;
  notes: string | null;
  claimed_at: string;
};

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [listingResp, claimsResp] = await Promise.all([
    supabase
      .from("open_shift_listings")
      .select("id, title, role, venue, starts_at, ends_at, pay_rate_cents, currency, skills_required, max_claims, notes, listing_state, created_at")
      .eq("id", listingId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("open_shift_claims")
      .select("id, user_id, claim_state, notes, claimed_at")
      .eq("listing_id", listingId)
      .eq("org_id", session.orgId)
      .order("claimed_at", { ascending: true })
      .limit(200),
  ]);

  if (!listingResp.data) return notFound();

  const listing = listingResp.data as {
    id: string; title: string; role: string; venue: string | null;
    starts_at: string; ends_at: string; pay_rate_cents: number | null;
    currency: string; skills_required: string[]; max_claims: number;
    notes: string | null; listing_state: string; created_at: string;
  };

  const rawClaims = (claimsResp.data ?? []) as Array<{
    id: string; user_id: string; claim_state: string; notes: string | null; claimed_at: string;
  }>;

  const userIds = Array.from(new Set(rawClaims.map((c) => c.user_id)));
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, name, email").in("id", userIds)
    : { data: [] };

  const userMap = new Map(
    ((users ?? []) as Array<{ id: string; name: string | null; email: string }>)
      .map((u) => [u.id, u.name ?? u.email]),
  );

  const claims: ClaimRow[] = rawClaims.map((c) => ({
    id: c.id,
    user_name: userMap.get(c.user_id) ?? "Unknown",
    claim_state: c.claim_state,
    notes: c.notes,
    claimed_at: c.claimed_at,
  }));

  const pending = claims.filter((c) => c.claim_state === "pending").length;
  const approved = claims.filter((c) => c.claim_state === "approved").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.openShifts.eyebrow", undefined, "Workforce · Open Shifts")}
        title={listing.title}
        subtitle={`${listing.role}${listing.venue ? ` · ${listing.venue}` : ""} · ${formatShiftWindow(listing.starts_at, listing.ends_at)}`}
        breadcrumbs={[{ label: "Open Shifts", href: "/console/workforce/open-shifts" }]}
        actions={
          listing.listing_state === "open" ? (
            <form action={cancelListingAction}>
              <input type="hidden" name="listing_id" value={listing.id} />
              <button type="submit" className="btn btn-secondary btn-sm">
                {t("console.workforce.openShifts.detail.cancel", undefined, "Cancel Listing")}
              </button>
            </form>
          ) : undefined
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.openShifts.metric.state", undefined, "State")}
            value={toTitle(listing.listing_state)}
            accent={listing.listing_state === "open"}
          />
          <MetricCard
            label={t("console.workforce.openShifts.metric.pending", undefined, "Pending")}
            value={String(pending)}
          />
          <MetricCard
            label={t("console.workforce.openShifts.metric.approved", undefined, "Approved / Slots")}
            value={`${approved} / ${listing.max_claims}`}
          />
        </div>

        {/* Listing details */}
        <div className="surface p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {t("console.workforce.openShifts.detail.status", undefined, "Status")}
            </span>
            <Badge variant={LISTING_STATE_TONE[listing.listing_state as keyof typeof LISTING_STATE_TONE] ?? "muted"}>
              {toTitle(listing.listing_state)}
            </Badge>
          </div>
          {listing.pay_rate_cents != null && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("console.workforce.openShifts.detail.pay", undefined, "Pay")}</span>
              <span className="font-mono">{formatPayRate(listing.pay_rate_cents, listing.currency)}</span>
            </div>
          )}
          {listing.skills_required.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium shrink-0">
                {t("console.workforce.openShifts.detail.skills", undefined, "Required Skills")}
              </span>
              <div className="flex flex-wrap gap-1 justify-end">
                {listing.skills_required.map((s) => (
                  <Badge key={s} variant="muted">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {listing.notes && (
            <div className="pt-1 border-t border-[var(--border)]">
              <p className="text-[var(--text-secondary)]">{listing.notes}</p>
            </div>
          )}
        </div>

        {/* Claims table */}
        <DataTable<ClaimRow>
          tableId="workforce.open_shift_claims"
          rows={claims}
          emptyLabel={t("console.workforce.openShifts.claims.empty", undefined, "No claims yet")}
          emptyDescription={t(
            "console.workforce.openShifts.claims.emptyDesc",
            undefined,
            "Crew members will appear here once they claim this shift from the COMPVSS app.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.workforce.openShifts.column.crew", undefined, "Crew Member"),
              render: (r) => r.user_name,
              accessor: (r) => r.user_name,
              filterable: true,
            },
            {
              key: "notes",
              header: t("console.workforce.openShifts.column.notes", undefined, "Note"),
              render: (r) => r.notes ?? "—",
              accessor: (r) => r.notes ?? null,
            },
            {
              key: "state",
              header: t("console.workforce.openShifts.column.state", undefined, "State"),
              render: (r) => (
                <Badge variant={CLAIM_STATE_TONE[r.claim_state as keyof typeof CLAIM_STATE_TONE] ?? "muted"}>
                  {toTitle(r.claim_state)}
                </Badge>
              ),
              accessor: (r) => r.claim_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "action",
              header: t("console.workforce.openShifts.column.action", undefined, "Action"),
              render: (r) =>
                r.claim_state === "pending" ? (
                  <div className="flex items-center gap-1">
                    <form action={decideClaimAction}>
                      <input type="hidden" name="claim_id" value={r.id} />
                      <input type="hidden" name="listing_id" value={listingId} />
                      <input type="hidden" name="decision" value="approved" />
                      <button type="submit" className="btn btn-primary btn-xs">
                        {t("console.workforce.openShifts.action.approve", undefined, "Approve")}
                      </button>
                    </form>
                    <form action={decideClaimAction}>
                      <input type="hidden" name="claim_id" value={r.id} />
                      <input type="hidden" name="listing_id" value={listingId} />
                      <input type="hidden" name="decision" value="declined" />
                      <button type="submit" className="btn btn-secondary btn-xs">
                        {t("console.workforce.openShifts.action.decline", undefined, "Decline")}
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ),
              accessor: () => null,
            },
          ]}
        />
      </div>
    </>
  );
}
