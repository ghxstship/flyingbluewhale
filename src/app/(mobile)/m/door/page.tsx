import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { listFirstPartyListings } from "@/lib/box_office_ticketing";
import { DoorScanner, type DoorListing, type DoorLabels } from "./DoorScanner";

export const dynamic = "force-dynamic";

/**
 * /m/door — COMPVSS first-party box-office DOOR SCANNER. Scans issued event
 * tickets at the gate via the `redeem_event_ticket` RPC. The org's first-party
 * `event_listings` (`fulfillment='first_party'`) are the scope; the active
 * listing defaults to the soonest upcoming (or the most recent) and can be
 * switched via the chip selector. A live accepted-scan count for the active
 * listing is read from `event_ticket_scans` (org-scoped; RLS agrees).
 */
export default async function DoorPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { listing: requestedId } = await searchParams;

  const listings = await listFirstPartyListings(supabase, session.orgId);

  if (listings.length === 0) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.door.eyebrow", undefined, "Box Office")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.door.title", undefined, "Door Scanner")}
        </h1>
        <div className="hint" style={{ padding: "12px 4px" }}>
          {t("m.door.noListings", undefined, "No first-party events to scan yet.")}
        </div>
      </div>
    );
  }

  // Default selection: the soonest upcoming event, else the most recent. The
  // library lists newest-first, so scan forward for the first future start.
  const now = Date.now();
  const upcoming = [...listings]
    .filter((l) => l.starts_at && new Date(l.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime());
  // `listings` is non-empty here (early-returned above), so `listings[0]` is safe.
  const fallback = upcoming[0] ?? listings[0]!;
  const active = (requestedId ? listings.find((l) => l.id === requestedId) : undefined) ?? fallback;

  // Live scanned count: accepted redemptions for the active listing.
  const { count } = await supabase
    .from("event_ticket_scans")
    .select("id", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("event_listing_id", active.id)
    .eq("result", "accepted");

  const scannedIn = count ?? 0;

  const listing: DoorListing = {
    id: active.id,
    title: active.title,
    slug: active.slug,
    venueName: active.venue_name,
    startsAt: active.starts_at,
  };

  const labels: DoorLabels = {
    eyebrow: t("m.door.count", { count: scannedIn }, `${scannedIn} Scanned In`),
    title: t("m.door.title", undefined, "Door"),
    scanHint: t("m.door.scanHint", undefined, "Point at the ticket QR or barcode"),
    manualLabel: t("m.door.manualLabel", undefined, "Ticket Code"),
    manualPlaceholder: t("m.door.manualPlaceholder", undefined, "e.g. TIX-014-AB"),
    cta: t("m.door.cta", undefined, "Redeem Ticket"),
    scanning: t("m.door.scanning", undefined, "Checking…"),
    recentTitle: t("m.door.recentTitle", undefined, "This Session"),
    recentEmpty: t("m.door.recentEmpty", undefined, "Scans appear here as you go."),
    holder: t("m.door.holder", undefined, "Holder"),
    seat: t("m.door.seat", undefined, "Seat"),
    gatePlaceholder: t("m.door.gate", undefined, "Main Gate"),
    offlineError: t(
      "m.door.offlineError",
      undefined,
      "No connection. This scan was NOT recorded. Ticket redeems need a live connection; retry when back online.",
    ),
    results: {
      accepted: t("m.door.result.accepted", undefined, "Accepted"),
      duplicate: t("m.door.result.duplicate", undefined, "Already redeemed"),
      refunded: t("m.door.result.refunded", undefined, "Refunded"),
      voided: t("m.door.result.voided", undefined, "Voided"),
      not_found: t("m.door.result.notFound", undefined, "Not found"),
    },
  };

  return (
    <div className="screen screen-anim">
      {listings.length > 1 && (
        <div className="seg2" style={{ marginBottom: 14, flexWrap: "wrap" }}>
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/m/door?listing=${l.id}`}
              className={l.id === active.id ? "on" : ""}
              style={{ textDecoration: "none", textAlign: "center" }}
            >
              {l.title}
            </Link>
          ))}
        </div>
      )}
      <DoorScanner listing={listing} gate={labels.gatePlaceholder} labels={labels} />
    </div>
  );
}
