import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
  { href: "/console/safety/medical/encounters", label: "Encounters", description: "PHI-encrypted clinical log" },
  { href: "/console/safety/medical/plan", label: "Medical Plan", description: "Games medical services plan" },
  { href: "/m/medic", label: "Mobile Triage", description: "Field clinicians log encounters" },
  { href: "/console/operations/incidents", label: "Incidents", description: "Cross-domain feed" },
];

type EnvironmentalRow = {
  id: string;
  kind: string;
  severity: string;
  started_at: string;
  ended_at: string | null;
};

const SEVERITY_TONE: Record<string, "muted" | "warning" | "error"> = {
  low: "muted",
  medium: "warning",
  high: "error",
  critical: "error",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Medical" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Safety"
        title="Medical"
        subtitle="Encounters · medical plan · environmental response"
        action={
          <Button href="/console/safety/medical/encounters/new" size="sm">
            + Encounter
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Encounters · 24h" value={fmtIntl.number(enc24 ?? 0)} accent />
          <MetricCard label="Encounters · 7d" value={fmtIntl.number(enc7 ?? 0)} />
          <MetricCard label="Active Env. Events" value={fmtIntl.number(env.length)} />
        </div>

        {env.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Open Environmental Events</h3>
            <ul className="mt-3 space-y-1.5">
              {env.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{e.kind.replace(/_/g, " ")}</span>{" "}
                    <span className="font-mono text-xs text-[var(--text-muted)]">since {fmt(e.started_at)}</span>
                  </div>
                  <Badge variant={SEVERITY_TONE[e.severity] ?? "muted"}>{toTitle(e.severity)}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">Drill In</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HUB_TILES.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{t.description}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
