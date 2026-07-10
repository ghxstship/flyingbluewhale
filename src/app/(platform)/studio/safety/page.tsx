import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { countOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Safety & Incidents hub — B-15: tiles carry a one-line description plus a
 * live org-scoped count (`count: "exact", head: true` — no rows fetched), and
 * the module's own children that were previously ⌘K-only (Briefings, OSHA 300,
 * Lost & Found) are surfaced as tiles. Lens tiles that filter the shared
 * `incidents` store (Cyber IR, OSHA, Lost & Found) intentionally show no
 * count rather than a misleading one.
 */

type Tile = {
  href: string;
  label: string;
  description: string;
  /** Key into the counts map; omitted for filtered-lens tiles. */
  countKey?: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const tiles: Tile[] = [
    {
      href: "/studio/safety/incidents",
      label: t("console.safety.incidentsLabel", undefined, "Incidents"),
      description: t("console.safety.desc.incidents", undefined, "Unified incident log across every domain"),
      countKey: "incidents",
    },
    {
      href: "/studio/safety/threats",
      label: t("console.safety.threatsLabel", undefined, "Threats"),
      description: t("console.safety.desc.threats", undefined, "Threat register and assessments"),
      countKey: "threats",
    },
    {
      href: "/studio/safety/playbooks",
      label: t("console.safety.playbooksLabel", undefined, "Playbooks"),
      description: t("console.safety.desc.playbooks", undefined, "Response procedures, ready before you need them"),
      countKey: "playbooks",
    },
    {
      href: "/studio/safety/guard-tours",
      label: t("console.safety.guardToursLabel", undefined, "Guard tours"),
      description: t("console.safety.desc.guardTours", undefined, "Patrol routes and checkpoint completions"),
      countKey: "guard_tours",
    },
    {
      href: "/studio/safety/major-incident",
      label: t("console.safety.majorIncidentLabel", undefined, "Major incident"),
      description: t("console.safety.desc.majorIncident", undefined, "Escalated events with command structure"),
      countKey: "major_incidents",
    },
    {
      href: "/studio/safety/briefings",
      label: t("console.safety.briefingsLabel", undefined, "Briefings"),
      description: t("console.safety.desc.briefings", undefined, "Toolbox talks and sign-in sheets"),
      countKey: "safety_briefings",
    },
    {
      href: "/studio/safety/osha",
      label: t("console.safety.oshaLabel", undefined, "OSHA 300"),
      description: t("console.safety.desc.osha", undefined, "Recordable injury and illness log"),
    },
    {
      href: "/studio/safety/lost-found",
      label: t("console.safety.lostFoundLabel", undefined, "Lost & Found"),
      description: t("console.safety.desc.lostFound", undefined, "Reported items and reunification"),
    },
    {
      href: "/studio/safety/cyber-ir",
      label: t("console.safety.cyberIrLabel", undefined, "Cyber IR"),
      description: t("console.safety.desc.cyberIr", undefined, "Cyber incident response lens"),
    },
    {
      href: "/studio/safety/medical/plan",
      label: t("console.safety.medicalPlan", undefined, "Medical plan"),
      description: t("console.safety.desc.medicalPlan", undefined, "Coverage levels, posts, and protocols"),
    },
    {
      href: "/studio/safety/medical/encounters",
      label: t("console.safety.medicalEncounters", undefined, "Medical encounters"),
      description: t("console.safety.desc.medicalEncounters", undefined, "Patient contacts and dispositions"),
      countKey: "medical_encounters",
    },
    {
      href: "/studio/safety/environmental",
      label: t("console.safety.environmentalLabel", undefined, "Environmental"),
      description: t("console.safety.desc.environmental", undefined, "Weather, air quality, and site conditions"),
      countKey: "environmental_events",
    },
    {
      href: "/studio/safety/crisis",
      label: t("console.safety.crisisComms", undefined, "Crisis comms"),
      description: t("console.safety.desc.crisis", undefined, "Alerting templates and broadcast log"),
      countKey: "crisis_alerts",
    },
    {
      href: "/studio/safety/safeguarding",
      label: t("console.safety.safeguardingLabel", undefined, "Safeguarding"),
      description: t("console.safety.desc.safeguarding", undefined, "Welfare reports and protection cases"),
      countKey: "safeguarding_reports",
    },
    {
      href: "/studio/safety/bcdr",
      label: t("console.safety.bcdrLabel", undefined, "BC/DR"),
      description: t("console.safety.desc.bcdr", undefined, "Continuity plans and readiness exercises"),
      countKey: "readiness_exercises",
    },
  ];

  // Live tile counts — org-scoped, head-only so we never pull rows to count.
  const counts = new Map<string, number>();
  if (hasSupabase) {
    const session = await requireSession();
    const tables = [
      "incidents",
      "threats",
      "playbooks",
      "guard_tours",
      "major_incidents",
      "safety_briefings",
      "medical_encounters",
      "environmental_events",
      "crisis_alerts",
      "safeguarding_reports",
      "readiness_exercises",
    ] as const;
    const results = await Promise.all(tables.map((table) => countOrgScoped(table, session.orgId)));
    tables.forEach((table, i) => counts.set(table, results[i] ?? 0));
  }

  return (
    <>
      <ModuleHeader
        title={t("console.safety.title", undefined, "Safety & Incidents")}
        subtitle={t("console.safety.subtitle", undefined, "Prevention, response, and the record of both")}
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const count = tile.countKey ? counts.get(tile.countKey) : undefined;
            return (
              <Link key={tile.href} className="surface hover-lift p-4" href={tile.href}>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-medium">{tile.label}</div>
                  {count != null && (
                    <div className="font-mono text-xs text-[var(--p-text-2)] tabular-nums">{fmt.number(count)}</div>
                  )}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.description}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
