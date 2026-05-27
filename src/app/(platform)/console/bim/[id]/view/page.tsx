import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import ViewerLoader from "./viewer-loader";

export const dynamic = "force-dynamic";

type Model = {
  id: string;
  name: string;
  source_type: string;
  storage_path: string;
  model_state: string;
  project: { id: string; name: string | null } | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { id } = await params;

  const { data: row } = await supabase
    .from("bim_models")
    .select("id, name, source_type, storage_path, model_state, project:project_id(id, name)")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const m = row as unknown as Model;

  const supportsWebViewer = m.source_type === "ifc" || m.source_type === "ifc_zip";

  return (
    <>
      <ModuleHeader
        eyebrow={`BIM Viewer · ${m.project?.name ?? "Project"}`}
        title={m.name}
        subtitle={`${m.source_type.toUpperCase()} · ${m.model_state}`}
        action={
          <div className="flex items-center gap-2">
            <a
              href={`/api/v1/bim/${m.id}/download`}
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Download {m.source_type.toUpperCase()}
            </a>
            <Button href={`/console/bim/${m.id}`} size="sm" variant="ghost">
              ← Back to Model
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-3">
        {supportsWebViewer ? (
          <ViewerLoader modelId={m.id} ifcUrl={`/api/v1/bim/${m.id}/download`} />
        ) : (
          <div className="surface p-6 text-sm">
            <p>
              Web viewer supports IFC only (via web-ifc). This model is{" "}
              <Badge variant="info">{m.source_type.toUpperCase()}</Badge> — use the Autodesk Forge integration for Revit
              / Navisworks, or download and open locally.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
