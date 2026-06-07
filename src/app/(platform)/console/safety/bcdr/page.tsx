import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ExerciseRow = {
  id: string;
  name: string;
  kind: string;
  scheduled_at: string | null;
};

type PlaybookRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  version: number;
  updated_at: string;
};

const KIND_TONE: Record<string, "muted" | "info" | "warning"> = {
  ttx: "info",
  full_scale: "warning",
  drill: "muted",
  walkthrough: "muted",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.bcdr.eyebrow", undefined, "Safety")}
          title={t("console.safety.bcdr.title", undefined, "BC / DR")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.bcdr.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();

  function fmtDate(iso: string | null): string {
    if (!iso) return t("console.safety.bcdr.tbd", undefined, "TBD");
    return fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  }
  const [{ data: exData }, { data: pbData }] = await Promise.all([
    supabase
      .from("readiness_exercises")
      .select("id, name, kind, scheduled_at")
      .eq("org_id", session.orgId)
      .order("scheduled_at", { ascending: true })
      .limit(50),
    supabase
      .from("playbooks")
      .select("id, slug, title, status, version, updated_at")
      .eq("org_id", session.orgId)
      .eq("kind", "crisis")
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const exercises = (exData ?? []) as ExerciseRow[];
  const playbooks = (pbData ?? []) as PlaybookRow[];
  const upcoming = exercises.filter((e) => e.scheduled_at && new Date(e.scheduled_at).getTime() >= Date.now());
  const published = playbooks.filter((p) => p.status === "published").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.bcdr.eyebrow", undefined, "Safety")}
        title={t("console.safety.bcdr.title", undefined, "BC / DR")}
        subtitle={t("console.safety.bcdr.subtitle", undefined, "Continuity runbooks + exercises.")}
        action={
          <Button href="/console/safety/playbooks/new" size="sm">
            {t("console.safety.bcdr.newRunbook", undefined, "+ New Runbook")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.safety.bcdr.metric.crisisRunbooks", undefined, "Crisis Runbooks")}
            value={fmt.number(playbooks.length)}
            accent
          />
          <MetricCard
            label={t("console.safety.bcdr.metric.published", undefined, "Published")}
            value={fmt.number(published)}
          />
          <MetricCard
            label={t("console.safety.bcdr.metric.exercisesScheduled", undefined, "Exercises Scheduled")}
            value={fmt.number(upcoming.length)}
          />
        </div>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.safety.bcdr.section.crisisRunbooks", undefined, "Crisis Runbooks")}
          </h3>
          <ul className="mt-3 space-y-2">
            {playbooks.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title={t("console.safety.bcdr.empty.runbooks.title", undefined, "No Crisis Runbooks Yet")}
                  description={t(
                    "console.safety.bcdr.empty.runbooks.description",
                    undefined,
                    "Author crisis-tagged playbooks (evac, weather hold, IT outage) — they appear here.",
                  )}
                  action={
                    <Link href="/console/safety/playbooks/new" className="ps-btn ps-btn--ghost ps-btn--sm">
                      {t("console.safety.bcdr.newRunbook", undefined, "+ New Runbook")}
                    </Link>
                  }
                />
              </li>
            ) : (
              playbooks.map((p) => (
                <li key={p.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <Link
                      href={`/console/safety/playbooks/${p.slug}`}
                      className="text-sm font-medium hover:text-[var(--p-accent)]"
                    >
                      {p.title}
                    </Link>
                    <div className="font-mono text-xs text-[var(--p-text-2)]">v{p.version}</div>
                  </div>
                  <Badge variant={p.status === "published" ? "success" : "muted"}>{toTitle(p.status)}</Badge>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.safety.bcdr.section.exercises", undefined, "Exercises")}
          </h3>
          <ul className="mt-3 space-y-2">
            {exercises.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title={t("console.safety.bcdr.empty.exercises.title", undefined, "No Exercises Scheduled")}
                  description={t(
                    "console.safety.bcdr.empty.exercises.description",
                    undefined,
                    "TTX, drills, full-scale exercises live in Programs → Readiness.",
                  )}
                  action={
                    <Link href="/console/programs/readiness" className="ps-btn ps-btn--ghost ps-btn--sm">
                      {t("console.safety.bcdr.openReadiness", undefined, "Open Readiness")}
                    </Link>
                  }
                />
              </li>
            ) : (
              exercises.map((e) => (
                <li key={e.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="font-mono text-xs text-[var(--p-text-2)]">{fmtDate(e.scheduled_at)}</div>
                  </div>
                  <Badge variant={KIND_TONE[e.kind] ?? "muted"}>{toTitle(e.kind)}</Badge>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
