import { Trophy, Ticket, ScanLine, Sparkles, MapPin, Flame, Users, Compass, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import { OnsiteSetTimes } from "@/components/gvteway/OnsiteSetTimes";
import { VenueMap } from "@/components/gvteway/VenueMap";
import { OnsiteWayfinding } from "@/components/gvteway/OnsiteWayfinding";
import { OnsiteARLauncher } from "@/components/gvteway/OnsiteARLauncher";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { LoyaltyTier } from "@/components/ui/LoyaltyTier";
import { AchievementBadge } from "@/components/ui/AchievementBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import {
  listUpcomingSetTimes,
  listFollowedPresence,
  listLinkedPasses,
  listAvailableMenu,
  computeOnsiteScore,
  type OnsiteScore,
} from "@/lib/gvteway";
import { checkInAction, catchSetAction, placeOrderAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * /p/onsite — the live-event Onsite center (design_handoff §2/§3). The guest's
 * "I'm at the venue" home, fully wired to real Supabase:
 *   • now/next set times + clash detection + per-set "Catch" ← `set_time`
 *   • coarse find-my-friends ← `presence` (RLS: self + followed), the GUEST
 *     plan via `<VenueMap>` — NOT the operator `<FloorPlan>`
 *   • AIGA signage wayfinding · order-to-seat ← `venue_menu_item` / `onsite_order`
 *   • read-only linked-pass wallet ← `linked_pass`
 *   • gamification ← `onsite_points` ledger → tier + earned achievements; points
 *     awarded only via the `award_onsite_points` SECURITY DEFINER RPC
 *
 * Lives in the GVTEWAY consumer shell beside Discover/Community/Scenes: the
 * audience is the ticket-holder, and the crew band carries no GVTEWAY reach
 * (`entitlements.json`). It shipped in the COMPVSS tab bar 2026-06-23 and was
 * rehomed here 2026-07-15; the crew credential wallet stays at `/m/pass`.
 *
 * The AR overlay sits behind `NEXT_PUBLIC_ONSITE_AR` and is off by default.
 */
const AR_ENABLED = process.env.NEXT_PUBLIC_ONSITE_AR === "1";

const ZERO_SCORE: OnsiteScore = {
  points: 0,
  tier: "Newcomer",
  nextTier: "Regular",
  nextThreshold: 100,
  achievements: { checkIn: false, streak: false, squad: false },
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function PortalOnsitePage() {
  const session = await requireSession();
  const supabase = hasSupabase ? await createClient() : null;

  const [sets, zones, passes, menu, score] = supabase
    ? await Promise.all([
        listUpcomingSetTimes(supabase),
        listFollowedPresence(supabase, session.userId),
        listLinkedPasses(supabase, session.userId),
        listAvailableMenu(supabase),
        computeOnsiteScore(supabase, session.userId),
      ])
    : [[], [], [], [], ZERO_SCORE];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="eyebrow eyebrow-accent">GVTEWAY</p>
        <h1>My Night</h1>
        <p className="text-[var(--p-text-2)]">Set times, your people, and your passes — all in one place.</p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="eyebrow flex items-center gap-1.5">
            <ScanLine size={13} aria-hidden="true" /> Live schedule
          </h2>
          {score.achievements.checkIn ? (
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--p-success-text,var(--p-text-2))]">
              <CheckCircle2 size={14} aria-hidden="true" /> Checked in
            </span>
          ) : (
            <form action={checkInAction}>
              <button
                type="submit"
                className="ps-btn ps-btn--cta ps-btn--sm"
              >
                Check in
              </button>
            </form>
          )}
        </div>
        <OnsiteSetTimes sets={sets} catchAction={catchSetAction} />
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">Find your friends</h2>
        <VenueMap zones={zones} sharing={zones.length > 0} />
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow flex items-center gap-1.5">
          <Compass size={13} aria-hidden="true" /> Getting around
        </h2>
        {/* Wayfinding speaks the shared AIGA signage language (§3). */}
        <OnsiteWayfinding />
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow flex items-center gap-1.5">
          <UtensilsCrossed size={13} aria-hidden="true" /> Order to your seat
        </h2>
        {menu.length === 0 ? (
          <EmptyState
            size="compact"
            icon={<UtensilsCrossed size={28} />}
            title="Not available here yet"
            description="At participating venues, browse the F&B and merch menu and we'll run your order to your spot — no queue."
          />
        ) : (
          <ul className="space-y-2">
            {menu.map((item) => (
              <li
                key={item.id}
                className="surface flex items-center justify-between gap-3 rounded-[var(--p-r-md)] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--p-text-1)]">{item.name}</p>
                  <p className="truncate text-xs text-[var(--p-text-3)]">
                    {item.category}
                    {item.description ? ` · ${item.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm font-semibold text-[var(--p-text-1)]">{money(item.priceCents)}</span>
                  <form action={placeOrderAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="ps-btn ps-btn--ghost ps-btn--sm">
                      Order
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow flex items-center gap-1.5">
          <Ticket size={13} aria-hidden="true" /> Your passes
        </h2>
        {passes.length === 0 ? (
          <EmptyState
            size="compact"
            icon={<Ticket size={28} />}
            title="No linked passes"
            description="Connect a ticketing provider in your account and your passes mirror here, read-only — ready to add to your OS wallet. GVTEWAY never holds your ticket of record."
          />
        ) : (
          <ul className="space-y-2">
            {passes.map((p) => (
              <li
                key={p.id}
                className="surface flex items-center justify-between gap-3 rounded-[var(--p-r-md)] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--p-text-1)]">{p.eventName}</p>
                  <p className="truncate text-xs text-[var(--p-text-3)]">
                    {[p.venueName, p.tier, p.seat].filter(Boolean).join(" · ") || "Pass"}
                  </p>
                </div>
                <Badge variant={p.passState === "owned" ? "success" : "muted"}>{p.passState}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow flex items-center gap-1.5">
          <Trophy size={13} aria-hidden="true" /> Tonight
        </h2>
        {/* Real points ledger (`onsite_points`) → tier + earned achievements. */}
        <LoyaltyTier
          tier={score.tier}
          points={score.points}
          nextTier={score.nextTier}
          nextThreshold={score.nextThreshold}
        />
        <ul className="grid grid-cols-3 gap-2">
          {[
            { name: "First check-in", description: "Arrive and check in", icon: <MapPin size={16} />, earned: score.achievements.checkIn },
            { name: "Set streak", description: "Catch 3 sets", icon: <Flame size={16} />, earned: score.achievements.streak },
            { name: "Squad up", description: "Find a friend onsite", icon: <Users size={16} />, earned: score.achievements.squad },
          ].map((b) => (
            <li key={b.name}>
              <AchievementBadge
                name={b.name}
                description={b.description}
                icon={b.icon}
                earned={b.earned}
                size="compact"
              />
            </li>
          ))}
        </ul>
      </section>

      {AR_ENABLED && (
        <section className="space-y-3">
          <h2 className="eyebrow flex items-center gap-1.5">
            <Sparkles size={13} aria-hidden="true" /> AR view
          </h2>
          <OnsiteARLauncher />
        </section>
      )}
    </div>
  );
}
