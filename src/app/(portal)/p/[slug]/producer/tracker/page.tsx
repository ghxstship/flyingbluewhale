import { notFound } from "next/navigation";
import Link from "next/link";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { hasSupabase } from "@/lib/env";
import { SELECT_COLUMNS, TrackerView, type TrackerRow } from "@/components/xpms/TrackerView";
import { AtomDrillIn } from "@/components/xpms/AtomDrillIn";
import { fetchAtomDrillIn } from "@/lib/xpms/drill-in";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Producer portal — read-only WBS rollup tracker mirroring the console
 * Tracker, with per-atom drill-in.
 */
export default async function ProducerTracker({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ atom?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("p.producer.tracker.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { slug } = await params;
  const { atom: focusedAtomId } = await searchParams;
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("v_xpms_atom_rollup_recursive")
    .select(SELECT_COLUMNS)
    .eq("project_id", project.id)
    .order("wbs_path", { ascending: true });

  const atoms = (rows ?? []) as unknown as TrackerRow[];
  const drillIn = focusedAtomId ? await fetchAtomDrillIn(project.org_id, focusedAtomId) : null;

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "producer")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.producer.tracker.title", undefined, "Tracker")}</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {atoms.length === 1
            ? t(
                "p.producer.tracker.atomCount.one",
                { count: atoms.length },
                `${atoms.length} atom across the project WBS.`,
              )
            : t(
                "p.producer.tracker.atomCount.other",
                { count: atoms.length },
                `${atoms.length} atoms across the project WBS.`,
              )}
        </p>
        <div className="mt-5">
          <TrackerView
            atoms={atoms}
            atomHrefBuilder={(id) => `/p/${slug}/producer/tracker?atom=${id}`}
            emptyAction={
              <Link className="text-sm text-[var(--org-primary)]" href={`/p/${slug}/producer`}>
                {t("p.producer.tracker.backToOverview", undefined, "← Back to overview")}
              </Link>
            }
          />
        </div>
      </div>
      {drillIn && (
        <AtomDrillIn
          atom={drillIn.atom}
          tasks={drillIn.tasks}
          deliverables={drillIn.deliverables}
          expenses={drillIn.expenses}
          poLines={drillIn.poLines}
          variances={drillIn.variances}
        />
      )}
    </div>
  );
}
