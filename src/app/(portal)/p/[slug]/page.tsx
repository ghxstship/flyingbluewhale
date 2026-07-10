import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { portalPersonaForSession, PORTAL_PERSONAS, type PortalPersona } from "@/lib/nav";
import { PublicEventLobby, type LobbyVenue } from "@/components/gvteway/PublicEventLobby";
import { listSetTimesForProject } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  primary_venue_id: string | null;
};

async function loadProject(slug: string): Promise<{ project: ProjectRow; venue: LobbyVenue | null } | null> {
  if (!hasSupabase) return { project: { id: "", name: slug, description: null, start_date: null, end_date: null, primary_venue_id: null }, venue: null };
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, description, start_date, end_date, primary_venue_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const project = data as ProjectRow;
  let venue: LobbyVenue | null = null;
  if (project.primary_venue_id) {
    const { data: loc } = await supabase
      .from("locations")
      .select("name, address, city, lat, lng")
      .eq("id", project.primary_venue_id)
      .maybeSingle();
    venue = (loc as LobbyVenue | null) ?? null;
  }
  return { project, venue };
}

// The portal slug maps to a project that is NOT a published-public record (no
// public/visibility flag on `projects` — RLS only opens the row to portal
// access). So the logged-out lobby is a share/lobby surface, not a crawl
// target: noindex it to avoid leaking private project slugs into search. The
// indexable public event surface is the published `event_listings` → /events/[slug].
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadProject(slug);
  const name = loaded?.project.name ?? slug;
  return {
    title: `${name}: tickets, lineup & info`,
    description: `Lineup, set times, venue, and tickets for ${name} on GVTEWAY.`,
    robots: { index: false, follow: true },
  };
}

export default async function PortalGateway({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { t } = await getRequestT();

  const loaded = await loadProject(slug);
  if (!loaded) notFound();
  const { project, venue } = loaded;

  // Logged-out visitors get the public event lobby (the GVTEWAY growth/share
  // surface). Authenticated collaborators get the persona gateway.
  const session = await getSession();
  if (!session) {
    const lineup = hasSupabase && project.id ? await listSetTimesForProject(await createClient(), project.id) : [];
    return (
      <PublicEventLobby
        slug={slug}
        projectName={project.name}
        startDate={project.start_date}
        endDate={project.end_date}
        description={project.description}
        venue={venue}
        lineup={lineup}
      />
    );
  }

  // Viewers whose session persona maps to a portal sub-persona go straight
  // to their home — the picker grid is an operator/preview affordance
  // (`?view=all` keeps it reachable for anyone).
  const sp = searchParams ? await searchParams : {};
  const showAll = sp?.view === "all";
  const mine = portalPersonaForSession(session.persona);
  if (mine && !showAll) redirect(`/p/${slug}/${mine}`);

  const personaCopy: Record<PortalPersona, { label: string; desc: string }> = {
    promoter: {
      label: t("p.shared.gateway.promoter.label", undefined, "Promoter"),
      desc: t("p.shared.gateway.promoter.desc", undefined, "Co-pro splits, settlements, marketing"),
    },
    producer: {
      label: t("p.shared.gateway.producer.label", undefined, "Producer"),
      desc: t("p.shared.gateway.producer.desc", undefined, "Readiness, approvals, portfolio"),
    },
    stakeholder: {
      label: t("p.shared.gateway.stakeholder.label", undefined, "Stakeholder"),
      desc: t("p.shared.gateway.stakeholder.desc", undefined, "Portfolio, governance, reporting"),
    },
    artist: {
      label: t("p.shared.gateway.artist.label", undefined, "Artist"),
      desc: t("p.shared.gateway.artist.desc", undefined, "Riders, advancing, schedule, travel"),
    },
    athlete: {
      label: t("p.shared.gateway.athlete.label", undefined, "Athlete"),
      desc: t("p.shared.gateway.athlete.desc", undefined, "Training, requests, travel documents"),
    },
    delegation: {
      label: t("p.shared.gateway.delegation.label", undefined, "Delegation"),
      desc: t("p.shared.gateway.delegation.desc", undefined, "Entries, accommodation, visas"),
    },
    client: {
      label: t("p.shared.gateway.client.label", undefined, "Client"),
      desc: t("p.shared.gateway.client.desc", undefined, "Proposals, deliverables, invoices, files"),
    },
    sponsor: {
      label: t("p.shared.gateway.sponsor.label", undefined, "Sponsor"),
      desc: t("p.shared.gateway.sponsor.desc", undefined, "Activations, brand assets, reporting"),
    },
    media: {
      label: t("p.shared.gateway.media.label", undefined, "Media"),
      desc: t("p.shared.gateway.media.desc", undefined, "Accreditation, press conferences, services"),
    },
    vendor: {
      label: t("p.shared.gateway.vendor.label", undefined, "Vendor"),
      desc: t("p.shared.gateway.vendor.desc", undefined, "Submissions, POs, invoices, credentials"),
    },
    crew: {
      label: t("p.shared.gateway.crew.label", undefined, "Crew"),
      desc: t("p.shared.gateway.crew.desc", undefined, "Call sheet, time, advances"),
    },
    volunteer: {
      label: t("p.shared.gateway.volunteer.label", undefined, "Volunteer"),
      desc: t("p.shared.gateway.volunteer.desc", undefined, "Application, schedule, training"),
    },
    hospitality: {
      label: t("p.shared.gateway.hospitality.label", undefined, "Hospitality"),
      desc: t("p.shared.gateway.hospitality.desc", undefined, "Itinerary, guests, accommodation"),
    },
    guest: {
      label: t("p.shared.gateway.guest.label", undefined, "Guest"),
      desc: t("p.shared.gateway.guest.desc", undefined, "Tickets, schedule, logistics"),
    },
    vip: {
      label: t("p.shared.gateway.vip.label", undefined, "VIP"),
      desc: t("p.shared.gateway.vip.desc", undefined, "Itinerary, transport, accommodation"),
    },
  };

  const groups: Array<{ label: string; personas: PortalPersona[] }> = [
    {
      label: t("p.shared.gateway.group.executive", undefined, "Executive"),
      personas: ["promoter", "producer", "stakeholder"],
    },
    {
      label: t("p.shared.gateway.group.talent", undefined, "Talent"),
      personas: ["artist", "athlete", "delegation"],
    },
    {
      label: t("p.shared.gateway.group.partners", undefined, "Partners"),
      personas: ["client", "sponsor", "media"],
    },
    {
      label: t("p.shared.gateway.group.operations", undefined, "Operations"),
      personas: ["vendor", "crew", "volunteer", "hospitality"],
    },
    {
      label: t("p.shared.gateway.group.experience", undefined, "Experience"),
      personas: ["guest", "vip"],
    },
  ];
  // Sanity: keep the grid in lockstep with the canonical persona list.
  const covered = new Set(groups.flatMap((g) => g.personas));
  for (const p of PORTAL_PERSONAS) if (!covered.has(p)) groups[groups.length - 1].personas.push(p);

  return (
    <div className="min-h-screen">
      <ModuleHeader
        title={project.name}
        subtitle={
          mine
            ? t("p.shared.gateway.previewSubtitle", undefined, "Previewing every portal view for this project")
            : t("p.shared.gateway.subtitle", { slug }, `Choose how you're collaborating on /${slug}`)
        }
      />
      <div className="page-content space-y-6">
        {mine ? (
          <p className="text-xs text-[var(--p-text-2)]">
            <Link className="underline" href={`/p/${slug}/${mine}`}>
              {t("p.shared.gateway.backToMine", undefined, "Back to your view")}
            </Link>
          </p>
        ) : null}
        {groups.map((group) => (
          <section key={group.label}>
            <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">{group.label}</h2>
            <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.personas.map((key) => (
                <Link key={key} href={`/p/${slug}/${key}`} className="card p-6">
                  <div className="flex items-center gap-2">
                    <div className="text-label text-[var(--brand-color)]">{personaCopy[key].label}</div>
                    {mine === key ? (
                      <Badge variant="success">{t("p.shared.gateway.yourView", undefined, "Your view")}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{personaCopy[key].desc}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
