import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
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
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ResourcesHubPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.resources.eyebrow", undefined, "LEG3ND")}
          title={t("console.legend.resources.title", undefined, "Resources")}
        />
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
        eyebrow={t("console.legend.resources.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.resources.title", undefined, "Resources")}
        subtitle={
          resources.length === 1
            ? t("console.legend.resources.oneResource", undefined, "1 resource")
            : t("console.legend.resources.nResources", { count: resources.length }, `${resources.length} resources`)
        }
        breadcrumbs={[
          { label: t("console.legend.resources.eyebrow", undefined, "LEG3ND") },
          { label: t("console.legend.resources.title", undefined, "Resources") },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/legend/resources/collections" size="sm" variant="secondary">
              {t("console.legend.resources.collections", undefined, "Collections")}
            </Button>
            <Button href="/legend/resources/new">{t("console.legend.resources.newResource", undefined, "+ New Resource")}</Button>
          </div>
        }
      />
      <div className="page-content space-y-8">
        {resources.length === 0 && collections.length === 0 ? (
          <EmptyState
            title={t("console.legend.resources.emptyTitle", undefined, "No resources yet")}
            description={t(
              "console.legend.resources.emptyDescription",
              undefined,
              "Build a curated library of links, documents, templates, and references, grouped into collections.",
            )}
            action={<Button href="/legend/resources/new">{t("console.legend.resources.newResource", undefined, "+ New Resource")}</Button>}
            secondaryAction={
              <Button href="/legend/resources/collections/new" variant="secondary">
                {t("console.legend.resources.newCollection", undefined, "New Collection")}
              </Button>
            }
          />
        ) : (
          groups.map((group) => (
            <section key={group.collection?.id ?? "ungrouped"} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
                    {group.collection
                      ? group.collection.name
                      : t("console.legend.resources.ungrouped", undefined, "Ungrouped")}
                  </h2>
                  {group.collection?.description && (
                    <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{group.collection.description}</p>
                  )}
                </div>
                <Badge variant="muted">
                  {group.resources.length === 1
                    ? t("console.legend.resources.oneItem", undefined, "1 item")
                    : t("console.legend.resources.nItems", { count: group.resources.length }, `${group.resources.length} items`)}
                </Badge>
              </div>
              <DataView<Resource>
                tableId={`t:/legend/resources:${group.collection?.id ?? "ungrouped"}`}
                rows={group.resources}
                rowHref={(r) => `/legend/resources/${r.id}`}
                emptyLabel={t("console.legend.resources.emptyCollection", undefined, "No resources in this collection")}
                emptyDescription={t(
                  "console.legend.resources.emptyCollectionDescription",
                  undefined,
                  "Add a resource and assign it to this collection.",
                )}
                columns={[
                  {
                    key: "title",
                    header: t("console.legend.resources.columns.title", undefined, "Title"),
                    render: (r) => r.title,
                    accessor: (r) => r.title,
                  },
                  {
                    key: "kind",
                    header: t("console.legend.resources.columns.kind", undefined, "Kind"),
                    render: (r) => RESOURCE_KIND_LABELS[r.kind],
                    accessor: (r) => r.kind,
                  },
                  {
                    key: "tags",
                    header: t("console.legend.resources.columns.tags", undefined, "Tags"),
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
                    header: t("console.legend.resources.columns.status", undefined, "Status"),
                    render: (r) => <StatusBadge status={r.resource_state} />,
                    accessor: (r) => r.resource_state,
                  },
                  {
                    key: "created",
                    header: t("console.legend.resources.columns.added", undefined, "Added"),
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
