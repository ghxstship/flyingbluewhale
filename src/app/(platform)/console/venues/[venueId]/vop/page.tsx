import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type VenueRow = { id: string; name: string };
type SectionRow = {
  id: string;
  section_key: string;
  title: string;
  body: string | null;
  status: string;
  approved_at: string | null;
  updated_at: string;
};

const SECTION_ORDER = [
  "overview",
  "organisation",
  "schedule",
  "arrivals_departures",
  "safety_security",
  "medical",
  "transport",
  "catering",
  "accreditation",
  "communications",
  "sustainability",
  "annexes",
] as const;

const SECTION_LABEL: Record<string, string> = {
  overview: "Overview",
  organisation: "Organisation",
  schedule: "Schedule",
  arrivals_departures: "Arrivals & Departures",
  safety_security: "Safety & Security",
  medical: "Medical",
  transport: "Transport",
  catering: "Catering",
  accreditation: "Accreditation",
  communications: "Communications",
  sustainability: "Sustainability",
  annexes: "Annexes",
};

const STATUS_TONE: Record<string, "muted" | "info" | "success"> = {
  draft: "muted",
  in_review: "info",
  approved: "success",
  published: "success",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venue" title="Venue Operations Plan" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: venueData }, { data: sectionData }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("venue_vop_sections")
      .select("id, section_key, title, body, status, approved_at, updated_at")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const sections = ((sectionData ?? []) as unknown as SectionRow[]) ?? [];
  const byKey = new Map(sections.map((s) => [s.section_key, s]));

  const approved = sections.filter((s) => s.status === "approved" || s.status === "published").length;
  const total = SECTION_ORDER.length;

  return (
    <>
      <ModuleHeader
        eyebrow="Venue"
        title={`${venue.name} — Venue Operations Plan`}
        subtitle={`${approved}/${total} sections approved`}
        breadcrumbs={[
          { label: "Venues", href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: "VOP" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Approved" value={approved.toLocaleString()} accent />
          <MetricCard label="Drafted" value={sections.length.toLocaleString()} />
          <MetricCard label="Outstanding" value={(total - sections.length).toLocaleString()} />
        </div>

        <div className="surface overflow-hidden">
          <ul className="divide-y divide-[var(--border-color)]">
            {SECTION_ORDER.map((key) => {
              const s = byKey.get(key);
              return (
                <li key={key} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{SECTION_LABEL[key]}</div>
                    {s?.body && <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">{s.body}</p>}
                    {s?.approved_at && (
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                        approved {fmt(s.approved_at)}
                      </p>
                    )}
                  </div>
                  <Badge variant={s ? (STATUS_TONE[s.status] ?? "muted") : "muted"}>
                    {s ? s.status.replace(/_/g, " ") : "missing"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          The Venue Operations Plan is the integrated operating manual for race-week. Each section above maps to a
          discipline lead — every section must reach <code>approved</code> before the venue is cleared for go-live.
        </p>
      </div>
    </>
  );
}
