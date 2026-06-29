import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { joinWaitlist, leaveWaitlist } from "./actions";

export const dynamic = "force-dynamic";

/**
 * /p/[slug]/guest/waitlist/[itemId] — join or leave the waitlist for a sold-out ticket type.
 * Eventbrite / Tixr marketplace parity (competitive feature 2026-06-29).
 */
export default async function GuestWaitlistPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) notFound();

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Catalog item details.
  const { data: item } = await supabase
    .from("master_catalog_items")
    .select("id, name, kind, inventory_qty")
    .eq("id", itemId)
    .eq("kind", "ticket")
    .is("deleted_at", null)
    .maybeSingle();
  if (!item) notFound();

  // Count current assignments to determine sold-out state.
  const { count: issued } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("catalog_item_id", itemId)
    .not("fulfillment_state", "in", '("voided","returned","expired")');

  const inventoryQty = (item as { inventory_qty: number | null }).inventory_qty;
  const isSoldOut = inventoryQty !== null && (issued ?? 0) >= inventoryQty;

  // The caller's existing waitlist entry (if any).
  const { data: existing } = await supabase
    .from("catalog_waitlist")
    .select("id, position, joined_at")
    .eq("catalog_item_id", itemId)
    .eq("party_user_id", session.userId)
    .maybeSingle();

  // Queue size.
  const { count: queueSize } = await supabase
    .from("catalog_waitlist")
    .select("id", { count: "exact", head: true })
    .eq("catalog_item_id", itemId);

  const myEntry = existing as { id: string; position: number; joined_at: string } | null;
  const itemTyped = item as { id: string; name: string; kind: string };

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "guest")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={t("p.guest.waitlist.eyebrow", undefined, "Tickets")}
          title={t("p.guest.waitlist.title", { name: itemTyped.name }, `Waitlist — ${itemTyped.name}`)}
        />
        <div className="page-content max-w-xl">

          {/* Status banner */}
          <div className={`ps-alert ${isSoldOut ? "ps-alert--warn" : "ps-alert--ok"}`} style={{ marginBottom: 20 }}>
            {isSoldOut
              ? t(
                  "p.guest.waitlist.soldOut",
                  { qty: inventoryQty },
                  `This ticket type is sold out (${inventoryQty} issued). Join the waitlist to be notified if a spot opens.`,
                )
              : t(
                  "p.guest.waitlist.available",
                  undefined,
                  "Tickets are currently available. You can still join the waitlist.",
                )}
          </div>

          <div className="surface p-5" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--p-text-2)", marginBottom: 6 }}>
              {t("p.guest.waitlist.queueSize", { n: queueSize ?? 0 }, `${queueSize ?? 0} on waitlist`)}
            </div>
            {myEntry ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {t("p.guest.waitlist.myPosition", { n: myEntry.position }, `You are #${myEntry.position} in line`)}
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginBottom: 16 }}>
                  {t(
                    "p.guest.waitlist.joinedAt",
                    { date: fmt.date(myEntry.joined_at), time: fmt.time(myEntry.joined_at) },
                    `Joined ${fmt.date(myEntry.joined_at)} at ${fmt.time(myEntry.joined_at)}`,
                  )}
                </div>
                <form action={leaveWaitlist}>
                  <input type="hidden" name="entry_id" value={myEntry.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="catalog_item_id" value={itemId} />
                  <button type="submit" className="ps-btn ps-btn--ghost">
                    {t("p.guest.waitlist.leave", undefined, "Leave Waitlist")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, marginBottom: 16 }}>
                  {t(
                    "p.guest.waitlist.joinPrompt",
                    undefined,
                    "Join the waitlist and we'll notify you the moment a ticket becomes available.",
                  )}
                </p>
                <form action={joinWaitlist}>
                  <input type="hidden" name="catalog_item_id" value={itemId} />
                  <input type="hidden" name="slug" value={slug} />
                  <button type="submit" className="ps-btn ps-btn--cta">
                    {t("p.guest.waitlist.join", undefined, "Join Waitlist")}
                  </button>
                </form>
              </>
            )}
          </div>

          <p style={{ fontSize: 12, color: "var(--p-text-3)" }}>
            {t(
              "p.guest.waitlist.disclaimer",
              undefined,
              "Joining the waitlist does not guarantee a ticket. If a spot opens, you'll receive a notification and have a limited window to claim it.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
