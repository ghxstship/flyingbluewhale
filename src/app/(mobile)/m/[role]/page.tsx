import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { MOBILE_ROLES, type MobileRole } from "@/lib/nav";

/**
 * Per-role mobile home (ADR-0009 scaffold).
 *
 * Dynamic route `/m/[role]` matches any of the six MobileRole values
 * and renders a role-scoped dashboard. Next.js static-route priority
 * means existing surfaces like `/m/gate`, `/m/shift`, `/m/inbox` keep
 * resolving — only the six role names fall here.
 *
 * The full URL refactor (moving `/m/<surface>` under `/m/[role]/<surface>`
 * with a middleware grace window) is a dedicated PR per ADR-0009
 * §"Migration rules". This scaffold provides the entry point so the
 * role chooser at `/m/settings/role` has somewhere to land.
 */
export const dynamic = "force-dynamic";

const ROLE_LINKS: Record<MobileRole, Array<{ label: string; href: string; desc?: string }>> = {
  performer: [
    { label: "Schedule", href: "/m/shift", desc: "Your show + rehearsal timeline" },
    { label: "Advancing", href: "/m/advances", desc: "Riders, credentials, travel, lodging" },
    { label: "Feed", href: "/m/feed", desc: "Announcements + updates" },
    { label: "Guide", href: "/m/guide", desc: "Boarding pass + know-before-you-go" },
  ],
  crew: [
    { label: "Shift", href: "/m/shift", desc: "Today's call + swaps" },
    { label: "Clock In", href: "/m/clock", desc: "Punch time, meal credits" },
    { label: "Run of Show", href: "/m/ros", desc: "Cue-by-cue program" },
    { label: "Daily Log", href: "/m/daily-log", desc: "What happened on shift" },
    { label: "Punch", href: "/m/punch", desc: "Open construction items" },
    { label: "Time Off", href: "/m/time-off" },
  ],
  driver: [
    { label: "Run Sheet", href: "/m/driver", desc: "Today's pickups + drops" },
    { label: "Wayfind", href: "/m/wayfind", desc: "Site map + parking" },
    { label: "A&D", href: "/m/ad", desc: "Arrival / departure tracking" },
    { label: "Alerts", href: "/m/alerts" },
  ],
  medic: [
    { label: "Patient Log", href: "/m/medic", desc: "Active cases + history" },
    { label: "New Entry", href: "/m/medic/new", desc: "File a medical entry" },
    { label: "Alerts", href: "/m/alerts", desc: "Incoming escalations" },
    { label: "Safeguarding", href: "/m/safeguarding" },
  ],
  guard: [
    { label: "Gate Scan", href: "/m/gate", desc: "Credential check-in" },
    { label: "Patrol Log", href: "/m/guard", desc: "Patrol + post log" },
    { label: "Incidents", href: "/m/incidents", desc: "Org-wide queue" },
    { label: "File Incident", href: "/m/incident/new", desc: "Express one-field report" },
  ],
  admin: [
    { label: "Tools", href: "/m", desc: "All surfaces in the Tools drawer" },
    { label: "Run of Show", href: "/m/ros" },
    { label: "Dispatch", href: "/m/driver", desc: "Live transport board" },
    { label: "Incidents", href: "/m/incidents" },
    { label: "Feed", href: "/m/feed" },
    { label: "Onboarding", href: "/m/onboarding" },
  ],
};

const ROLE_TITLE: Record<MobileRole, string> = {
  performer: "Performer",
  crew: "Crew",
  driver: "Driver",
  medic: "Medic",
  guard: "Guard",
  admin: "Admin",
};

export default async function RoleHomePage({ params }: { params: Promise<{ role: string }> }) {
  const { role: roleParam } = await params;
  if (!MOBILE_ROLES.includes(roleParam as MobileRole)) notFound();
  const role = roleParam as MobileRole;
  await requireSession();
  const links = ROLE_LINKS[role];
  return (
    <div className="px-4 pt-4 pb-24">
      <ModuleHeader eyebrow="Role home" title={ROLE_TITLE[role]} subtitle="Your most-used tools for this role." />
      <div className="page-content grid grid-cols-1 gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="surface hover-lift p-4">
            <div className="text-sm font-medium">{l.label}</div>
            {l.desc ? <div className="mt-0.5 text-xs text-[var(--text-muted)]">{l.desc}</div> : null}
          </Link>
        ))}
        <Link href="/m/settings/role" className="mt-2 text-center text-xs text-[var(--text-muted)] underline">
          Switch role →
        </Link>
      </div>
    </div>
  );
}
