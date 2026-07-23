import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataView } from "@/components/views/DataViewServer";
import { DeleteForm } from "@/components/DeleteForm";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { RESOURCE_KIND_LABELS, type Resource, type ResourceCollection } from "@/lib/legend_resources";
import { CollectionForm } from "../CollectionForm";
import { deleteCollectionAction, updateCollectionAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function CollectionDetail({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  // Browse stays open to every member; authoring affordances are manager-band.
  const canAuthor = isManagerPlus(session);
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data } = await db
    .from("resource_collections")
    .select("id, org_id, name, description, sort_order, created_at, updated_at")
    .eq("id", collectionId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const collection = (data ?? null) as ResourceCollection | null;
  if (!collection) notFound();

  const { data: rData } = await db
    .from("resources")
    .select(
      "id, org_id, collection_id, title, description, kind, url, file_path, resource_state, tags, created_at, updated_at",
    )
    .eq("org_id", session.orgId)
    .eq("collection_id", collectionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const resources = (rData ?? []) as Resource[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.resources.collectionDetail.eyebrow", undefined, "Collection")}
        title={collection.name}
        subtitle={
          resources.length === 1
            ? t("console.legend.resources.oneResource", undefined, "1 resource")
            : t("console.legend.resources.nResources", { count: resources.length }, `${resources.length} resources`)
        }
        breadcrumbs={[
          { label: t("console.legend.resources.eyebrow", undefined, "LEG3ND") },
          { label: t("console.legend.resources.title", undefined, "Resources"), href: "/legend/resources" },
          { label: t("console.legend.resources.collectionsTitle", undefined, "Collections"), href: "/legend/resources/collections" },
          { label: collection.name },
        ]}
        action={
          canAuthor ? (
            <DeleteForm
              action={deleteCollectionAction.bind(null, collection.id)}
              confirm={t(
                "console.legend.resources.collectionDetail.deleteConfirm",
                { name: collection.name },
                `Delete collection "${collection.name}"? Its resources will become ungrouped.`,
              )}
              undo={{
                table: "resource_collections",
                id: collection.id,
                redirectTo: "/legend/resources/collections",
              }}
            />
          ) : undefined
        }
      />
      <div className="page-content space-y-8">
        {canAuthor && (
          <div className="surface p-6">
            <h3 className="mb-4 text-sm font-semibold">
              {t("console.legend.resources.collectionDetail.editHeading", undefined, "Edit collection")}
            </h3>
            <CollectionForm
              action={updateCollectionAction.bind(null, collection.id)}
              collection={collection}
              submitLabel={t("console.legend.resources.collectionDetail.submit", undefined, "Save Collection")}
            />
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
              {t("console.legend.resources.title", undefined, "Resources")}
            </h2>
            {canAuthor && (
              <Button href="/legend/resources/new" size="sm" variant="secondary">
                {t("console.legend.resources.newResource", undefined, "+ New Resource")}
              </Button>
            )}
          </div>
          <DataView<Resource>
            rows={resources}
            rowHref={(r) => `/legend/resources/${r.id}`}
            emptyLabel={t("console.legend.resources.emptyCollection", undefined, "No resources in this collection")}
            emptyDescription={t(
              "console.legend.resources.collectionDetail.emptyDescription",
              undefined,
              "Create a resource and assign it to this collection.",
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
      </div>
    </>
  );
}
