import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Job = {
  id: string;
  source: "schedule" | "credential";
  kind: "inspection" | "service" | "cert_renewal" | "compliance";
  target_kind: string;
  due_at: string;
  title: string;
  href: string;
  outcome: "pass" | "fail" | "partial" | null;
};

const KIND_TONE = {
  inspection: "info",
  service: "muted",
  cert_renewal: "warning",
  compliance: "purple",
} as const;

function bucketDate(d: string, now: number): "overdue" | "today" | "this_week" | "later" {
  const due = new Date(d).getTime();
  const oneDay = 86400_000;
  if (due < now) return "overdue";
  if (due - now <= oneDay) return "today";
  if (due - now <= 7 * oneDay) return "this_week";
  return "later";
}

const BUCKETS: Array<{
  key: ReturnType<typeof bucketDate>;
  label: string;
  tone: "error" | "warning" | "info" | "muted";
}> = [
  { key: "overdue", label: "Overdue", tone: "error" },
  { key: "today", label: "Due Today", tone: "warning" },
  { key: "this_week", label: "This Week", tone: "info" },
  { key: "later", label: "Later", tone: "muted" },
];

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.operations.maintenance.eyebrow", undefined, "Operations")}
          title={t("console.operations.maintenance.title", undefined, "Maintenance")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.operations.maintenance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Lane 1: explicit maintenance jobs from schedules.
  const { data: jobsData } = await supabase
    .from("maintenance_jobs")
    .select("id, kind, target_kind, due_at, completed_at, outcome, schedule_id, schedule:schedule_id(name)")
    .eq("org_id", session.orgId)
    .is("completed_at", null)
    .order("due_at", { ascending: true })
    .limit(200);
  type RawJob = {
    id: string;
    kind: Job["kind"];
    target_kind: string;
    due_at: string;
    completed_at: string | null;
    outcome: Job["outcome"];
    schedule_id: string | null;
    schedule: { name: string | null } | null;
  };
  const jobs: Job[] = ((jobsData ?? []) as unknown as RawJob[]).map((j) => ({
    id: j.id,
    source: "schedule",
    kind: j.kind,
    target_kind: j.target_kind,
    due_at: j.due_at,
    outcome: j.outcome,
    title: j.schedule?.name ?? `${j.kind} (${j.target_kind})`,
    href: `/console/operations/maintenance/${j.id}`,
  }));

  // Lane 2: credential expiry — synthesised so expirations show without the
  // operator having to author a schedule. Bucketed alongside scheduled jobs.
  const horizon = new Date(Date.now() + 60 * 86400_000).toISOString();
  const { data: credsData } = await supabase
    .from("credentials")
    .select("id, kind, number, expires_on")
    .eq("org_id", session.orgId)
    .not("expires_on", "is", null)
    .lte("expires_on", horizon.slice(0, 10))
    .order("expires_on", { ascending: true })
    .limit(200);
  type RawCred = { id: string; kind: string; number: string | null; expires_on: string | null };
  const credJobs: Job[] = ((credsData ?? []) as RawCred[]).map((c) => ({
    id: `cred:${c.id}`,
    source: "credential",
    kind: "cert_renewal",
    target_kind: "credential",
    due_at: c.expires_on as string,
    outcome: null,
    title: `${c.kind} expiry${c.number ? ` · ${c.number}` : ""}`,
    href: `/console/people/credentials/${c.id}`,
  }));

  const all: Job[] = [...jobs, ...credJobs].sort((a, b) => a.due_at.localeCompare(b.due_at));
  const now = Date.now();
  const grouped: Record<string, Job[]> = { overdue: [], today: [], this_week: [], later: [] };
  for (const j of all) grouped[bucketDate(j.due_at, now)].push(j);

  const overdueCount = grouped.overdue.length;
  const next7 = grouped.today.length + grouped.this_week.length;

  const bucketLabel = (key: ReturnType<typeof bucketDate>, fallback: string) =>
    t(`console.operations.maintenance.bucket.${key}`, undefined, fallback);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.maintenance.eyebrow", undefined, "Operations")}
        title={t("console.operations.maintenance.title", undefined, "Maintenance")}
        subtitle={t(
          "console.operations.maintenance.subtitle",
          { overdueCount, next7, total: all.length },
          `${overdueCount} overdue · ${next7} due in 7 days · ${all.length} Total upcoming`,
        )}
        action={
          <Button href="/console/operations/maintenance/schedules/new" size="sm">
            {t("console.operations.maintenance.newSchedule", undefined, "+ New Schedule")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {all.length === 0 ? (
          <div className="surface p-6 text-sm">
            <p className="text-[var(--text-secondary)]">
              {t(
                "console.operations.maintenance.emptyBody",
                undefined,
                "No maintenance due. Author a recurring schedule to start tracking scaffold safety re-checks, PA system pre-show diagnostics, generator service, or compliance audits.",
              )}
            </p>
            <div className="mt-3">
              <Button href="/console/operations/maintenance/schedules/new" size="sm">
                {t("console.operations.maintenance.authorSchedule", undefined, "+ Author a schedule")}
              </Button>
            </div>
          </div>
        ) : (
          BUCKETS.map((b) => {
            const list = grouped[b.key];
            if (list.length === 0) return null;
            return (
              <section key={b.key} className="surface">
                <header className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2.5">
                  <h3 className="text-sm font-semibold">{bucketLabel(b.key, b.label)}</h3>
                  <Badge variant={b.tone}>{list.length}</Badge>
                </header>
                <ul className="divide-y divide-[var(--border-color)]">
                  {list.map((j) => (
                    <li key={j.id} className="px-4 py-3">
                      <Link
                        href={j.href}
                        className="flex items-center justify-between gap-3 hover:bg-[var(--surface-inset)]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={KIND_TONE[j.kind]}>{toTitle(j.kind)}</Badge>
                            <span className="font-mono text-[10px] text-[var(--text-muted)]">{j.target_kind}</span>
                            {j.source === "credential" && (
                              <Badge variant="muted">
                                {t("console.operations.maintenance.autoBadge", undefined, "auto")}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 text-sm">{j.title}</div>
                        </div>
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {new Date(j.due_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
