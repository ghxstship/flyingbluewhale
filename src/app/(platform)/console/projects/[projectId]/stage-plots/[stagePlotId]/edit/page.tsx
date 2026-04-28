import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateStagePlot, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string; stagePlotId: string }> }) {
  const { projectId, stagePlotId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("stage_plots")
    .select("id, name, width_ft, depth_ft, notes")
    .eq("id", stagePlotId)
    .eq("project_id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const action = updateStagePlot.bind(null, projectId, stagePlotId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Stage plot" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/projects/${projectId}/stage-plots/${stagePlotId}`}
          submitLabel="Save changes"
        >
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Width (ft)"
              name="width_ft"
              type="number"
              step="any"
              defaultValue={row.width_ft != null ? String(row.width_ft) : ""}
            />
            <Input
              label="Depth (ft)"
              name="depth_ft"
              type="number"
              step="any"
              defaultValue={row.depth_ft != null ? String(row.depth_ft) : ""}
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notes</span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={2000}
              className="input-base focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--text-muted)]">
            Element placement is edited via the canvas on the detail page.
          </p>
        </FormShell>
      </div>
    </>
  );
}
