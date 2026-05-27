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
import { addBimModelLink, deleteBimModelLink, markBimModelReady } from "./actions";

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
  link_type: "rfi" | "submittal" | "issue" | "punch_item" | "inspection" | "transmittal_item";
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

const LINK_TYPE_LABEL: Record<LinkRow["link_type"], string> = {
  rfi: "RFI",
  submittal: "Submittal",
  issue: "Issue",
  punch_item: "Punch",
  inspection: "Inspection",
  transmittal_item: "Transmittal",
};

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

function fmtBytes(b: number | null): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

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
    .limit(200);
  const links = (linksData ?? []) as unknown as LinkRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={`BIM · ${m.project?.name ?? "Project"}`}
        title={m.name}
        subtitle={`${m.source_type.toUpperCase()}${m.discipline ? ` · ${m.discipline.toUpperCase()}` : ""} · ${links.length} hot link${links.length === 1 ? "" : "s"} · ${fmtBytes(m.size_bytes)}`}
        action={
          <div className="flex items-center gap-2">
            {(m.source_type === "ifc" || m.source_type === "ifc_zip") && (
              <a
                href={`/console/bim/${m.id}/view`}
                className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
              >
                Open 3D Viewer
              </a>
            )}
            <a
              href={`/api/v1/bim/${m.id}/download`}
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Download {m.source_type.toUpperCase()}
            </a>
            <Button href="/console/bim" size="sm" variant="ghost">
              ← All Models
            </Button>
          </div>
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
          {m.model_state === "uploaded" || m.model_state === "processing" ? (
            <form action={markBimModelReady} className="ms-auto">
              <input type="hidden" name="model_id" value={m.id} />
              <Button type="submit" size="sm">
                Mark Ready
              </Button>
            </form>
          ) : null}
        </div>

        <section className="surface space-y-2 p-4">
          <h2 className="text-sm font-semibold">Storage</h2>
          <p className="font-mono text-xs text-[var(--text-secondary)]">{m.storage_path}</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Click &ldquo;Download&rdquo; above to fetch the file via a 60-second signed URL. The web-based 3D viewer
            (web-ifc / Forge SDK) is the next engineering pass — element-link management below works against the
            existing metadata.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Hot Links ({links.length})</h2>
          {links.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              No element links yet. Add one below to anchor an RFI / submittal / punch / inspection / transmittal to a
              specific element GlobalId.
            </p>
          ) : (
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.id} className="surface flex items-center gap-3 p-2 text-xs">
                  <Badge variant="info">{LINK_TYPE_LABEL[l.link_type]}</Badge>
                  <span className="font-mono text-[var(--text-muted)]">{l.element_global_id}</span>
                  <span className="text-[var(--text-secondary)]">→ {l.target_id.slice(0, 8)}…</span>
                  {l.note && <span className="text-[var(--text-secondary)]">— {l.note}</span>}
                  <form action={deleteBimModelLink} className="ms-auto">
                    <input type="hidden" name="link_id" value={l.id} />
                    <input type="hidden" name="model_id" value={m.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form
            action={addBimModelLink}
            className="surface grid grid-cols-[120px_1fr_1fr_2fr_auto] items-center gap-2 p-3 text-xs"
          >
            <input type="hidden" name="model_id" value={m.id} />
            <select name="link_type" required className={`${INPUT} text-xs`} defaultValue="rfi">
              <option value="rfi">RFI</option>
              <option value="submittal">Submittal</option>
              <option value="issue">Issue</option>
              <option value="punch_item">Punch Item</option>
              <option value="inspection">Inspection</option>
              <option value="transmittal_item">Transmittal</option>
            </select>
            <input
              name="element_global_id"
              required
              placeholder="IfcRoot GlobalId or Forge dbId"
              className={`${INPUT} font-mono text-xs`}
            />
            <input name="target_id" required placeholder="Target UUID" className={`${INPUT} font-mono text-xs`} />
            <input name="note" placeholder="Note (optional)" className={`${INPUT} text-xs`} />
            <Button type="submit" size="sm" variant="secondary">
              + Add Link
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
