import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Resource, ResourceCollection } from "@/lib/legend_resources";

export const dynamic = "force-dynamic";

type CollectionRow = ResourceCollection & { resourceCount: number };

export default async function CollectionsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Collections" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: cData }, { data: rData }] = await Promise.all([
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
      .select("collection_id")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .limit(2000),
  ]);

  const collections = (cData ?? []) as ResourceCollection[];
  const resources = (rData ?? []) as Pick<Resource, "collection_id">[];
  const counts = new Map<string, number>();
  for (const r of resources) {
    if (!r.collection_id) continue;
    counts.set(r.collection_id, (counts.get(r.collection_id) ?? 0) + 1);
  }
  const rows: CollectionRow[] = collections.map((c) => ({ ...c, resourceCount: counts.get(c.id) ?? 0 }));

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="Collections"
        subtitle={rows.length === 1 ? "1 collection" : `${rows.length} collections`}
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Resources", href: "/legend/resources" },
          { label: "Collections" },
        ]}
        action={<Button href="/legend/resources/collections/new">+ New Collection</Button>}
      />
      <div className="page-content">
        <DataView<CollectionRow>
          rows={rows}
          rowHref={(r) => `/legend/resources/collections/${r.id}`}
          emptyLabel="No collections yet"
          emptyDescription="Group your resources into collections to organize the hub."
          columns={[
            {
              key: "name",
              header: "Name",
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "count",
              header: "Resources",
              render: (r) => String(r.resourceCount),
              accessor: (r) => r.resourceCount,
              tabular: true,
            },
            {
              key: "sort",
              header: "Sort",
              render: (r) => String(r.sort_order),
              accessor: (r) => r.sort_order,
              tabular: true,
            },
            {
              key: "created",
              header: "Added",
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
