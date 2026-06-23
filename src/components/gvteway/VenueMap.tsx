import { MapPin, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SignIcon } from "@/components/signage/SignIcon";

/**
 * VenueMap — guest "find my friends" for the live-event Onsite surface
 * (design_handoff §2). Deliberately the GUEST plan, NOT the operator
 * `<FloorPlan>` (guidelines/atlvs-kit-coherence-audit.md): coarse, zone-level,
 * opt-in presence reading `public.presence` → `public.venue_zones`. No precise
 * coordinates, no operator overlays — just "which zone are my people in".
 *
 * Presentational + server-safe. The page resolves `presence` rows once the
 * 20260623120000_gvteway_consumer.sql migration is applied (item 4); until then
 * it renders the opt-in firstRun state.
 *
 * Token-only colors.
 */
export type VenueZonePresence = {
  zoneId: string;
  zoneName: string;
  /** Names of followed users currently in this zone (opt-in). */
  friends: string[];
  /** AIGA pictogram ids for the zone's amenities (e.g. `aiga-toilets`). */
  amenities?: string[];
};

export function VenueMap({
  zones,
  sharing = false,
}: {
  zones: VenueZonePresence[];
  /** Whether the viewer is sharing their own coarse zone. */
  sharing?: boolean;
}) {
  const anyFriends = zones.some((z) => z.friends.length > 0);

  if (!sharing || zones.length === 0 || !anyFriends) {
    return (
      <EmptyState
        size="compact"
        icon={<MapPin size={28} />}
        title={sharing ? "No friends checked in yet" : "Find your friends onsite"}
        description={
          sharing
            ? "When people you follow share their zone, they’ll show up here — never a precise location, just which area they’re in."
            : "Share your zone to see where your people are. It’s coarse and opt-in — only people you follow, only the area, never the exact spot."
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {zones.map((z) => (
        <li
          key={z.zoneId}
          className="surface flex flex-col gap-1 rounded-[var(--p-r-md)] p-3"
        >
          <div className="flex items-center gap-1.5 text-[var(--p-text-2)]">
            <MapPin size={13} aria-hidden="true" />
            <span className="truncate text-xs font-semibold tracking-wide uppercase">{z.zoneName}</span>
          </div>
          {z.friends.length > 0 ? (
            <p className="flex items-center gap-1.5 text-sm text-[var(--p-text-1)]">
              <Users size={14} className="text-[var(--p-accent)]" aria-hidden="true" />
              <span className="truncate">{z.friends.join(", ")}</span>
            </p>
          ) : (
            <p className="text-xs text-[var(--p-text-3)]">No one here</p>
          )}
          {z.amenities && z.amenities.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 text-[var(--p-text-2)]">
              {z.amenities.map((a) => (
                <SignIcon key={a} name={a} size={16} />
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
