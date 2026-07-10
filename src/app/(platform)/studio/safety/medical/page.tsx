import Link from "next/link";
import { urlFor } from "@/lib/urls";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { SEVERITY_TONE } from "@/lib/tones";

export const dynamic = "force-dynamic";

const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
  { href: "/studio/safety/medical/encounters", label: "Encounters", description: "PHI-encrypted clinical log" },
  { href: "/studio/safety/medical/plan", label: "Medical Plan", description: "Games medical services plan" },
  { href: urlFor("mobile", "/incidents"), label: "Mobile Triage", description: "Field clinicians log encounters" },
  { href: "/studio/operations/incidents", label: "Incidents", description: "Cross-domain feed" },
];

type EnvironmentalRow = {
  id: string;
  kind: string;
  severity: string;
  started_at: string;
  ended_at: string | null;
};

function fmt(iso: string): string {
  return formatDateParts(new Date(iso), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.medical.eyebrow", undefined, "Safety")}
          title={t("console.safety.medical.title", undefined, "Medical")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.medical.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: enc24 }, { count: enc7 }, { data: envData }] = await Promise.all([
    supabase
      .from("medical_encounters")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .gte("created_at", since24),
    supabase
      .from("medical_encounters")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .gte("created_at", since7),
    supabase
      .from("environmental_events")
      .select("id, kind, severity, started_at, ended_at")
      .eq("org_id", session.orgId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const env = (envData ?? []) as EnvironmentalRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.medical.eyebrow", undefined, "Safety")}
        title={t("console.safety.medical.title", undefined, "Medical")}
        subtitle={t("console.safety.medical.subtitle", undefined, "Encounters · medical plan · environmental response")}
        action={
          <Button href="/studio/safety/medical/encounters/new" size="sm">
            {t("console.safety.medical.newEncounter", undefined, "+ Encounter")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.safety.medical.metrics.encounters24h", undefined, "Encounters · 24h")}
            value={fmtIntl.number(enc24 ?? 0)}
            accent
          />
          <MetricCard
            label={t("console.safety.medical.metrics.encounters7d", undefined, "Encounters · 7d")}
            value={fmtIntl.number(enc7 ?? 0)}
          />
          <MetricCard
            label={t("console.safety.medical.metrics.activeEnvEvents", undefined, "Active Env. Events")}
            value={fmtIntl.number(env.length)}
          />
        </div>

        {env.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.safety.medical.openEnvEvents", undefined, "Open Environmental Events")}
            </h3>
            <ul className="mt-3 space-y-1.5">
              {env.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{toTitle(e.kind)}</span>{" "}
                    <span className="font-mono text-xs text-[var(--p-text-2)]">
                      {t("console.safety.medical.sincePrefix", undefined, "since")} {fmt(e.started_at)}
                    </span>
                  </div>
                  <Badge variant={SEVERITY_TONE[e.severity] ?? "default"}>{toTitle(e.severity)}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">{t("console.safety.medical.drillIn", undefined, "Drill In")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HUB_TILES.map((tile) => (
              <Link key={tile.href} href={tile.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">
                  {t(`console.safety.medical.tiles.${tile.href}.label`, undefined, tile.label)}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(`console.safety.medical.tiles.${tile.href}.description`, undefined, tile.description)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
