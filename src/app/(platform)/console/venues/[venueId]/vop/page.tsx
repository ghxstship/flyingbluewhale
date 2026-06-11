import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

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

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.vop.eyebrow", undefined, "Venue")}
          title={t("console.venues.vop.title", undefined, "Venue Operations Plan")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.vop.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  const [{ data: venueData }, { data: sectionData }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("venue_vop_sections")
      .select("id, section_key, title, body, section_state, approved_at, updated_at")
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
        eyebrow={t("console.venues.vop.eyebrow", undefined, "Venue")}
        title={t("console.venues.vop.headerTitle", { name: venue.name }, `${venue.name} — Venue Operations Plan`)}
        subtitle={t("console.venues.vop.headerSubtitle", { approved, total }, `${approved}/${total} sections approved`)}
        breadcrumbs={[
          { label: t("console.venues.breadcrumb", undefined, "Venues"), href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: t("console.venues.vop.breadcrumb", undefined, "VOP") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.venues.vop.metrics.approved", undefined, "Approved")}
            value={fmt.number(approved)}
            accent
          />
          <MetricCard
            label={t("console.venues.vop.metrics.drafted", undefined, "Drafted")}
            value={fmt.number(sections.length)}
          />
          <MetricCard
            label={t("console.venues.vop.metrics.outstanding", undefined, "Outstanding")}
            value={fmt.number(total - sections.length)}
          />
        </div>

        <div className="surface overflow-hidden">
          <ul className="divide-y divide-[var(--p-border)]">
            {SECTION_ORDER.map((key) => {
              const s = byKey.get(key);
              return (
                <li key={key} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {t(`console.venues.vop.sections.${key}`, undefined, SECTION_LABEL[key])}
                    </div>
                    {s?.body && <p className="mt-0.5 line-clamp-2 text-xs text-[var(--p-text-2)]">{s.body}</p>}
                    {s?.approved_at && (
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--p-text-2)]">
                        {t(
                          "console.venues.vop.approvedOn",
                          { date: fmtDate(s.approved_at) },
                          `approved ${fmtDate(s.approved_at)}`,
                        )}
                      </p>
                    )}
                  </div>
                  <Badge variant={s ? toneFor(s.status) : "muted"}>
                    {s ? toTitle(s.status) : t("console.venues.vop.missing", undefined, "missing")}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.venues.vop.footerLead",
            undefined,
            "The Venue Operations Plan is the integrated operating manual for race-week. Each section above maps to a discipline lead — every section must reach",
          )}{" "}
          <code>approved</code>{" "}
          {t("console.venues.vop.footerTrail", undefined, "before the venue is cleared for go-live.")}
        </p>
      </div>
    </>
  );
}
