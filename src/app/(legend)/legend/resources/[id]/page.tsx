import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  RESOURCE_KIND_LABELS,
  RESOURCE_STATES,
  RESOURCE_STATE_LABELS,
  resourceTarget,
  type Resource,
  type ResourceCollection,
} from "@/lib/legend_resources";
import { deleteResourceAction, setResourceStateAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ResourceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("resources")
    .select(
      "id, org_id, collection_id, title, description, kind, url, file_path, resource_state, tags, created_at, updated_at",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const resource = (data ?? null) as Resource | null;
  if (!resource) notFound();

  let collection: ResourceCollection | null = null;
  if (resource.collection_id) {
    const { data: cData } = await db
      .from("resource_collections")
      .select("id, org_id, name, description, sort_order, created_at, updated_at")
      .eq("id", resource.collection_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    collection = (cData ?? null) as ResourceCollection | null;
  }

  const target = resourceTarget(resource);

  return (
    <>
      <ModuleHeader
        eyebrow="Resource"
        title={resource.title}
        subtitle={`${RESOURCE_KIND_LABELS[resource.kind]}${collection ? ` · ${collection.name}` : ""}`}
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Resources", href: "/legend/resources" },
          { label: resource.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/legend/resources/${resource.id}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            {RESOURCE_STATES.filter((s) => s !== resource.resource_state).map((s) => (
              <form key={s} action={setResourceStateAction.bind(null, resource.id, s)}>
                <Button type="submit" size="sm" variant="secondary">
                  {RESOURCE_STATE_LABELS[s]}
                </Button>
              </form>
            ))}
            <DeleteForm
              action={deleteResourceAction.bind(null, resource.id)}
              confirm={`Delete resource "${resource.title}"?`}
              undo={{ table: "resources", id: resource.id, redirectTo: "/legend/resources" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <Field label="State">
            <StatusBadge status={resource.resource_state} />
          </Field>
          <Field label="Kind">{RESOURCE_KIND_LABELS[resource.kind]}</Field>
          <Field label="Collection">{collection ? collection.name : "Ungrouped"}</Field>
          <Field label="Added">{timeAgo(resource.created_at)}</Field>
        </div>

        {target && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Link</h3>
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block font-mono text-sm break-all text-[var(--p-accent)] underline"
              >
                {resource.url}
              </a>
            ) : (
              <p className="mt-2 font-mono text-sm break-all text-[var(--p-text-2)]">{resource.file_path}</p>
            )}
          </div>
        )}

        {resource.tags.length > 0 && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="muted">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {resource.description && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{resource.description}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
