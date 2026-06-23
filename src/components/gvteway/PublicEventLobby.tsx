import Link from "next/link";
import { MapPin, CalendarDays, Navigation, Users, ArrowRight, Ticket } from "lucide-react";
import { OnsiteSetTimes, type SetTimeRow } from "@/components/gvteway/OnsiteSetTimes";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * PublicEventLobby — the logged-out public face of a project portal
 * (design_handoff §2, the "p/[slug] public event page"). A GVTEWAY growth/share
 * surface: hero, lineup/set-times, venue + directions, a "who's going" social
 * teaser, the integration-only ticketing model, "more like this", and a clear
 * path in for collaborators.
 *
 * Server-safe + presentational. Lineup (`set_time`) and social teaser
 * (`activity`/`follow`) resolve once 20260623120000_gvteway_consumer.sql is
 * applied; firstRun they render their empty states. Ticketing stays
 * integration-only — never an in-app checkout.
 *
 * Token-only colors.
 */
export type LobbyVenue = {
  name: string;
  address?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function fmtDateRange(start?: string | null, end?: string | null): string | null {
  if (!start) return null;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return null;
  const sStr = s.toLocaleDateString([], opts);
  if (!end) return sStr;
  const e = new Date(end);
  if (Number.isNaN(e.getTime())) return sStr;
  return `${s.toLocaleDateString([], { month: "short", day: "numeric" })} – ${e.toLocaleDateString([], opts)}`;
}

function directionsHref(venue: LobbyVenue): string | null {
  if (venue.lat != null && venue.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
  }
  const q = [venue.name, venue.address, venue.city].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export function PublicEventLobby({
  slug,
  projectName,
  startDate,
  endDate,
  description,
  venue,
  lineup = [],
}: {
  slug: string;
  projectName: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  venue?: LobbyVenue | null;
  /** Set times for this event (`public.set_time`). */
  lineup?: SetTimeRow[];
}) {
  const dateRange = fmtDateRange(startDate, endDate);
  const directions = venue ? directionsHref(venue) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
      {/* Hero */}
      <header className="space-y-3">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">GVTEWAY · Live event</p>
        <h1 className="text-4xl font-bold tracking-tight">{projectName}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--p-text-2)]">
          {dateRange && (
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} aria-hidden="true" /> {dateRange}
            </span>
          )}
          {venue?.name && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} aria-hidden="true" /> {venue.name}
              {venue.city ? `, ${venue.city}` : ""}
            </span>
          )}
        </div>
        {description && <p className="max-w-xl text-[var(--p-text-2)]">{description}</p>}
      </header>

      {/* Tickets — integration-only handoff, never an in-app checkout. */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
          <Ticket size={14} aria-hidden="true" /> Tickets
        </h2>
        <p className="max-w-xl text-sm text-[var(--p-text-3)]">
          GVTEWAY never sells you a ticket directly — when this event connects a provider (DICE · RA · AXS ·
          Ticketmaster · Eventbrite), the live availability and a <span className="font-medium">via &lt;provider&gt;</span>{" "}
          handoff appear here.
        </p>
      </section>

      {/* Lineup / set times */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Lineup</h2>
        <OnsiteSetTimes sets={lineup} />
      </section>

      {/* Venue & directions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Venue</h2>
        {venue?.name ? (
          <div className="surface flex flex-wrap items-center justify-between gap-3 rounded-[var(--p-r-md)] p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--p-text-1)]">{venue.name}</p>
              {(venue.address || venue.city) && (
                <p className="text-xs text-[var(--p-text-3)]">{[venue.address, venue.city].filter(Boolean).join(", ")}</p>
              )}
            </div>
            {directions && (
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-[var(--p-r-md)] border border-[var(--p-border-2)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface-2)]"
              >
                <Navigation size={13} aria-hidden="true" /> Get directions
              </a>
            )}
          </div>
        ) : (
          <EmptyState size="compact" icon={<MapPin size={28} />} title="Venue to be announced" />
        )}
      </section>

      {/* Who's going — social teaser */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
          <Users size={14} aria-hidden="true" /> Who&apos;s going
        </h2>
        <div className="surface flex flex-wrap items-center justify-between gap-3 rounded-[var(--p-r-md)] p-4">
          <p className="text-sm text-[var(--p-text-2)]">See which of your friends are into this night.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent-text)] hover:underline"
          >
            Sign in to see <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* More like this */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">More like this</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-[var(--p-r-md)] border border-[var(--p-border-2)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--p-surface-2)]"
          >
            Browse events <ArrowRight size={13} aria-hidden="true" />
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 rounded-[var(--p-r-md)] border border-[var(--p-border-2)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--p-surface-2)]"
          >
            Explore the marketplace <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Collaborator path in */}
      <section className="border-t border-[var(--p-border)] pt-6">
        <p className="text-sm text-[var(--p-text-2)]">
          Working this event?{" "}
          <Link href={`/login?next=/p/${slug}`} className="font-medium text-[var(--p-accent-text)] hover:underline">
            Sign in to collaborate
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
