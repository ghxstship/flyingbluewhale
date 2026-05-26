import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ModelState = "uploaded" | "processing" | "ready" | "failed" | "archived";

type Model = {
  id: string;
  name: string;
  discipline: string | null;
  source_type: string;
  storage_path: string;
  forge_urn: string | null;
  size_bytes: number | null;
  version_label: string | null;
  model_state: ModelState;
  uploaded_at: string;
  processed_at: string | null;
  failed_reason: string | null;
  project: { id: string; name: string | null } | null;
};

type LinkRow = {
  id: string;
  element_global_id: string;
  link_type: string;
  target_id: string;
  note: string | null;
  created_at: string;
};

const STATE_TONE: Record<ModelState, "muted" | "info" | "warning" | "success" | "error"> = {
  uploaded: "info",
  processing: "warning",
  ready: "success",
  failed: "error",
  archived: "muted",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { id } = await params;

  const { data: row } = await supabase
    .from("bim_models")
    .select(
      "id, name, discipline, source_type, storage_path, forge_urn, size_bytes, version_label, model_state, uploaded_at, processed_at, failed_reason, project:project_id(id, name)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const m = row as unknown as Model;

  const { data: linksData } = await supabase
    .from("bim_model_links")
    .select("id, element_global_id, link_type, target_id, note, created_at")
    .eq("model_id", id)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(100);
  const links = (linksData ?? []) as unknown as LinkRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={`BIM · ${m.project?.name ?? "Project"}`}
        title={m.name}
        subtitle={`${m.source_type.toUpperCase()}${m.discipline ? ` · ${m.discipline.toUpperCase()}` : ""} · ${links.length} hot link${links.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/bim" size="sm" variant="ghost">
            ← All Models
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={STATE_TONE[m.model_state]}>{toTitle(m.model_state)}</Badge>
          <span className="text-[var(--text-muted)]">
            Uploaded · {fmt.dateParts(m.uploaded_at, { year: "numeric", month: "short", day: "numeric" })}
          </span>
          {m.version_label && <span className="font-mono text-[var(--text-muted)]">{m.version_label}</span>}
          {m.forge_urn && (
            <span className="font-mono text-[10px] text-[var(--text-muted)]">URN {m.forge_urn.slice(0, 16)}…</span>
          )}
          {m.failed_reason && <span className="text-[var(--color-error)]">{m.failed_reason}</span>}
        </div>

        <section className="surface space-y-2 p-4">
          <h2 className="text-sm font-semibold">Storage</h2>
          <p className="font-mono text-xs text-[var(--text-secondary)]">{m.storage_path}</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Viewer hydration not yet wired — engineering pass forthcoming. The metadata + RLS are live.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Hot Links ({links.length})</h2>
          {links.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              No element links yet. Once the viewer is wired, click any element to attach an RFI / submittal / punch
              item.
            </p>
          ) : (
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.id} className="surface flex items-center gap-3 p-2 text-xs">
                  <span className="font-mono text-[var(--text-muted)] uppercase">{l.link_type}</span>
                  <span className="font-mono">{l.element_global_id.slice(0, 12)}…</span>
                  <span className="text-[var(--text-secondary)]">→ {l.target_id.slice(0, 8)}…</span>
                  {l.note && <span className="text-[var(--text-secondary)]">— {l.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
