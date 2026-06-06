import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CLAIM_STATE_TONE, LISTING_STATE_TONE, formatPayRate, formatShiftWindow } from "@/lib/open-shifts";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { claimShiftAction, withdrawClaimAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24">
        <h1 className="text-display mt-2 text-3xl">
          {t("m.openShifts.title", undefined, "Open Shifts")}
        </h1>
        <div className="card-elevated mt-6 p-4 text-sm">Configure Supabase.</div>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const [listingsResp, myClaimsResp] = await Promise.all([
    supabase
      .from("open_shift_listings")
      .select("id, title, role, venue, starts_at, ends_at, pay_rate_cents, currency, skills_required, max_claims, notes, listing_state")
      .eq("org_id", session.orgId)
      .eq("listing_state", "open")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(100),
    supabase
      .from("open_shift_claims")
      .select("id, listing_id, claim_state, claimed_at")
      .eq("user_id", session.userId)
      .order("claimed_at", { ascending: false })
      .limit(50),
  ]);

  type Listing = {
    id: string; title: string; role: string; venue: string | null;
    starts_at: string; ends_at: string; pay_rate_cents: number | null;
    currency: string; skills_required: string[]; max_claims: number;
    notes: string | null; listing_state: string;
  };

  type MyClaim = { id: string; listing_id: string; claim_state: string; claimed_at: string };

  const listings = (listingsResp.data ?? []) as Listing[];
  const myClaims = (myClaimsResp.data ?? []) as MyClaim[];
  const myClaimMap = new Map(myClaims.map((c) => [c.listing_id, c]));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">
        {t("m.openShifts.eyebrow", undefined, "Workforce")}
      </div>
      <h1 className="text-display mt-2 text-3xl">
        {t("m.openShifts.title", undefined, "Open Shifts")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {t(
          listings.length === 1 ? "m.openShifts.countOne" : "m.openShifts.countOther",
          { count: listings.length },
          `${listings.length} shift${listings.length === 1 ? "" : "s"} available to claim.`,
        )}
      </p>

      {/* My claims summary */}
      {myClaims.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            {t("m.openShifts.myClaims", undefined, "My Claims")}
          </p>
          <ul className="space-y-2">
            {myClaims.slice(0, 5).map((c) => {
              const listing = listings.find((l) => l.id === c.listing_id);
              return (
                <li key={c.id} className="card-elevated p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{listing?.title ?? "—"}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {listing ? formatShiftWindow(listing.starts_at, listing.ends_at) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.claim_state === "approved"
                          ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                          : c.claim_state === "pending"
                          ? "bg-[var(--color-info-subtle)] text-[var(--color-info)]"
                          : "bg-[var(--surface-raised)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {toTitle(c.claim_state)}
                    </span>
                    {c.claim_state === "pending" && (
                      <form action={withdrawClaimAction}>
                        <input type="hidden" name="claim_id" value={c.id} />
                        <button type="submit" className="btn btn-secondary btn-xs">
                          {t("m.openShifts.withdraw", undefined, "Withdraw")}
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Available listings */}
      {listings.length === 0 ? (
        <div className="card-elevated mt-6 p-6 text-center">
          <p className="text-sm font-medium">
            {t("m.openShifts.empty.label", undefined, "No open shifts right now")}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {t("m.openShifts.empty.desc", undefined, "Check back later — new shifts will appear here when posted.")}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {listings.map((listing) => {
            const myClaim = myClaimMap.get(listing.id);
            const alreadyClaimed = !!myClaim && myClaim.claim_state !== "withdrawn";
            return (
              <li key={listing.id} className="card-elevated p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{listing.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                      {listing.role}
                      {listing.venue ? ` · ${listing.venue}` : ""}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[var(--color-text-tertiary)]">
                      {formatShiftWindow(listing.starts_at, listing.ends_at)}
                    </p>
                    {listing.skills_required.length > 0 && (
                      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                        {listing.skills_required.join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {formatPayRate(listing.pay_rate_cents, listing.currency)}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {listing.max_claims} slot{listing.max_claims !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {listing.notes && (
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {listing.notes}
                  </p>
                )}

                <div className="mt-3">
                  {alreadyClaimed ? (
                    <p className="text-xs text-center text-[var(--color-text-secondary)]">
                      {t("m.openShifts.claimed", { state: toTitle(myClaim.claim_state) }, `Claimed · ${toTitle(myClaim.claim_state)}`)}
                    </p>
                  ) : (
                    <form action={claimShiftAction} className="flex gap-2">
                      <input type="hidden" name="listing_id" value={listing.id} />
                      <button type="submit" className="btn btn-primary btn-sm w-full">
                        {t("m.openShifts.claim", undefined, "Claim Shift")}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
