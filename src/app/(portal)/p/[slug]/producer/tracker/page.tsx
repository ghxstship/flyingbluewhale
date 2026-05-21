import { notFound } from "next/navigation";
import Link from "next/link";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { hasSupabase } from "@/lib/env";
import { SELECT_COLUMNS, TrackerView, type TrackerRow } from "@/components/xpms/TrackerView";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

/**
 * Producer portal — read-only WBS rollup tracker mirroring the console
 * Tracker. Producer is the EXECUTIVE-class external lead who wants
 * budget / variance / progress at a glance without operational detail.
 *
 * RLS on xpms_atoms + the underlying artifact tables enforces project
 * scope. We additionally filter the view to project_id = the slug's
 * project so cross-project atoms don't appear.
 */
export default async function ProducerTracker({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;
  const { data: rows } = (await loose
    .from("v_xpms_atom_rollup_recursive")
    .select(SELECT_COLUMNS)
    .eq("project_id", project.id)
    .order("wbs_path", { ascending: true })) as { data: TrackerRow[] | null };

  const atoms = rows ?? [];

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "producer")} title="Producer" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Tracker</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {atoms.length} atom{atoms.length === 1 ? "" : "s"} across the project WBS.
        </p>
        <div className="mt-5">
          <TrackerView
            atoms={atoms}
            atomHrefBuilder={(id) => `/p/${slug}/producer/tracker?atom=${id}`}
            emptyAction={
              <Link className="text-sm text-[var(--org-primary)]" href={`/p/${slug}/producer`}>
                ← Back to overview
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
