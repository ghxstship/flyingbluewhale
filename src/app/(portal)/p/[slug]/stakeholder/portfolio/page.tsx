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
 * Stakeholder portfolio — board/principal view of every project the org has,
 * grouped by xpms_phase. Read-only (no operational drill-in); mirrors the
 * producer portfolio but framed for the executive observer.
 */

type Project = {
  id: string;
  name: string;
  slug: string | null;
  xpms_phase: string | null;
  start_date: string | null;
  end_date: string | null;
};

const PHASE_ORDER = XPMS_PHASES.map((p) => p.id);

export default async function StakeholderPortfolio({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("p.stakeholder.portfolio.configureSupabase", undefined, "Configure Supabase.")}
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
      <PortalRail group={portalNav(slug, "stakeholder")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.stakeholder.portfolio.title", undefined, "Portfolio")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "p.stakeholder.portfolio.summary",
            { count: rows.length, phases: byPhase.size },
            `${rows.length} project${rows.length === 1 ? "" : "s"} across ${byPhase.size} phase${
              byPhase.size === 1 ? "" : "s"
            }.`,
          )}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("p.stakeholder.portfolio.empty.title", undefined, "No Projects")}
              description={t(
                "p.stakeholder.portfolio.empty.description",
                undefined,
                "Active projects across the portfolio appear here grouped by lifecycle phase.",
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
                    <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
                      {toTitle(phase)} <span>· {list.length}</span>
                    </h2>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={p.slug ? `/p/${p.slug}/stakeholder` : `/p/${slug}/stakeholder/pnl`}
                            className="surface hover-lift block p-4"
                          >
                            <div className="truncate text-sm font-semibold">{p.name}</div>
                            <div className="mt-1 flex items-center gap-2">
                              {p.xpms_phase && <Badge variant="muted">{toTitle(p.xpms_phase)}</Badge>}
                              {p.start_date && (
                                <span className="font-mono text-[10px] text-[var(--p-text-2)]">
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
