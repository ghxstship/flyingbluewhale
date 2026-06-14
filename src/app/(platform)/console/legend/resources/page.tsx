import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import {
  RESOURCE_KIND_LABELS,
  groupByCollection,
  type Resource,
  type ResourceCollection,
} from "@/lib/legend_resources";

export const dynamic = "force-dynamic";

export default async function ResourcesHubPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Resources" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: collectionData }, { data: resourceData }] = await Promise.all([
    db
      .from("resource_collections")
      .select("id, org_id, name, description, sort_order, created_at, updated_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(200),
    db
      .from("resources")
      .select(
        "id, org_id, collection_id, title, description, kind, url, file_path, resource_state, tags, created_at, updated_at",
      )
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const collections = (collectionData ?? []) as ResourceCollection[];
  const resources = (resourceData ?? []) as Resource[];
  const groups = groupByCollection(collections, resources);

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="Resources"
        subtitle={resources.length === 1 ? "1 resource" : `${resources.length} resources`}
        breadcrumbs={[{ label: "LEG3ND" }, { label: "Resources" }]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/legend/resources/collections" size="sm" variant="secondary">
              Collections
            </Button>
            <Button href="/console/legend/resources/new">+ New Resource</Button>
          </div>
        }
      />
      <div className="page-content space-y-8">
        {resources.length === 0 && collections.length === 0 ? (
          <EmptyState
            title="No resources yet"
            description="Build a curated library of links, documents, templates, and references — grouped into collections."
            action={<Button href="/console/legend/resources/new">+ New Resource</Button>}
            secondaryAction={
              <Button href="/console/legend/resources/collections/new" variant="secondary">
                New Collection
              </Button>
            }
          />
        ) : (
          groups.map((group) => (
            <section key={group.collection?.id ?? "ungrouped"} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
                    {group.collection ? group.collection.name : "Ungrouped"}
                  </h2>
                  {group.collection?.description && (
                    <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{group.collection.description}</p>
                  )}
                </div>
                <Badge variant="muted">
                  {group.resources.length === 1 ? "1 item" : `${group.resources.length} items`}
                </Badge>
              </div>
              <DataTable<Resource>
                rows={group.resources}
                rowHref={(r) => `/console/legend/resources/${r.id}`}
                emptyLabel="No resources in this collection"
                emptyDescription="Add a resource and assign it to this collection."
                columns={[
                  {
                    key: "title",
                    header: "Title",
                    render: (r) => r.title,
                    accessor: (r) => r.title,
                  },
                  {
                    key: "kind",
                    header: "Kind",
                    render: (r) => RESOURCE_KIND_LABELS[r.kind],
                    accessor: (r) => r.kind,
                  },
                  {
                    key: "tags",
                    header: "Tags",
                    render: (r) =>
                      r.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.tags.map((tag) => (
                            <Badge key={tag} variant="muted">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "—"
                      ),
                    accessor: (r) => r.tags.join(" "),
                  },
                  {
                    key: "state",
                    header: "State",
                    render: (r) => <StatusBadge status={r.resource_state} />,
                    accessor: (r) => r.resource_state,
                  },
                  {
                    key: "created",
                    header: "Added",
                    render: (r) => timeAgo(r.created_at),
                    accessor: (r) => r.created_at,
                  },
                ]}
              />
            </section>
          ))
        )}
      </div>
    </>
  );
}
