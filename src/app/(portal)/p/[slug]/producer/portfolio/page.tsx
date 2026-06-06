import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { XPMS_PHASES } from "@/lib/xpms";

export const dynamic = "force-dynamic";

/**
 * Producer portal portfolio — all projects in the org the caller has
 * visibility on, grouped by xpms_phase (production lifecycle). The
 * Producer dashboard's tile linked here as "All projects · Project
 * cards by phase".
 */

type Project = {
  id: string;
  name: string;
  slug: string | null;
  xpms_phase: string | null;
  start_date: string | null;
  end_date: string | null;
};

// Sequential macro-arc per LDP — the XPMS v08 8-gate lifecycle, in order.
// Mirrors projects.xpms_phase (migration 20260605170000).
const PHASE_ORDER = XPMS_PHASES.map((p) => p.id);

export default async function ProducerPortfolio({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("p.producer.portfolio.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("projects")
    .select("id, name, slug, xpms_phase, start_date, end_date")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(200);
  const rows = (data ?? []) as Project[];

  const byPhase = new Map<string, Project[]>();
  for (const p of rows) {
    const k = p.xpms_phase ?? "unphased";
    const list = byPhase.get(k) ?? [];
    list.push(p);
    byPhase.set(k, list);
  }

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "producer")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.producer.portfolio.title", undefined, "Portfolio")}</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {rows.length === 1
            ? t(
                "p.producer.portfolio.summary.one",
                { phases: byPhase.size },
                `1 project across ${byPhase.size} phase${byPhase.size === 1 ? "" : "s"}.`,
              )
            : t(
                "p.producer.portfolio.summary.other",
                { count: rows.length, phases: byPhase.size },
                `${rows.length} projects across ${byPhase.size} phase${byPhase.size === 1 ? "" : "s"}.`,
              )}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("p.producer.portfolio.empty.title", undefined, "No Projects")}
              description={t(
                "p.producer.portfolio.empty.description",
                undefined,
                "Projects you have producer visibility on appear here grouped by lifecycle phase.",
              )}
            />
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {[...PHASE_ORDER, "unphased"]
              .filter((p) => byPhase.has(p))
              .map((phase) => {
                const list = byPhase.get(phase) ?? [];
                return (
                  <section key={phase}>
                    <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                      {toTitle(phase)} <span>· {list.length}</span>
                    </h2>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={p.slug ? `/p/${p.slug}/producer` : `/console/projects/${p.id}`}
                            className="surface hover-lift block p-4"
                          >
                            <div className="truncate text-sm font-semibold">{p.name}</div>
                            <div className="mt-1 flex items-center gap-2">
                              {p.xpms_phase && <Badge variant="muted">{toTitle(p.xpms_phase)}</Badge>}
                              {p.start_date && (
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                  {fmt.date(p.start_date)}
                                  {p.end_date ? ` → ${fmt.date(p.end_date)}` : ""}
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
