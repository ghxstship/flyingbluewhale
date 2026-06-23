import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
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
    title: `${name} — tickets, lineup & info`,
    description: `Lineup, set times, venue, and tickets for ${name} on GVTEWAY.`,
    robots: { index: false, follow: true },
  };
}

export default async function PortalGateway({ params }: { params: Promise<{ slug: string }> }) {
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

  const PERSONAS = [
    {
      key: "artist",
      label: t("p.shared.gateway.artist.label", undefined, "Artist"),
      desc: t("p.shared.gateway.artist.desc", undefined, "Riders, advancing, schedule, travel"),
    },
    {
      key: "vendor",
      label: t("p.shared.gateway.vendor.label", undefined, "Vendor"),
      desc: t("p.shared.gateway.vendor.desc", undefined, "Submissions, POs, invoices, credentials"),
    },
    {
      key: "client",
      label: t("p.shared.gateway.client.label", undefined, "Client"),
      desc: t("p.shared.gateway.client.desc", undefined, "Proposals, deliverables, invoices, files"),
    },
    {
      key: "sponsor",
      label: t("p.shared.gateway.sponsor.label", undefined, "Sponsor"),
      desc: t("p.shared.gateway.sponsor.desc", undefined, "Activations, brand assets, reporting"),
    },
    {
      key: "guest",
      label: t("p.shared.gateway.guest.label", undefined, "Guest"),
      desc: t("p.shared.gateway.guest.desc", undefined, "Tickets, schedule, logistics"),
    },
    {
      key: "crew",
      label: t("p.shared.gateway.crew.label", undefined, "Crew"),
      desc: t("p.shared.gateway.crew.desc", undefined, "Call sheet, time, advances"),
    },
  ];

  return (
    <div className="min-h-screen">
      <ModuleHeader
        title={project.name}
        subtitle={t("p.shared.gateway.subtitle", { slug }, `Choose how you're collaborating on /${slug}`)}
      />
      <div className="page-content">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona) => (
            <Link key={persona.key} href={`/p/${slug}/${persona.key}`} className="card p-6">
              <div className="text-label text-[var(--brand-color)]">{persona.label}</div>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{persona.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
