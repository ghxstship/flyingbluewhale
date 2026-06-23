import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Resource, ResourceCollection } from "@/lib/legend_resources";
import { ResourceForm } from "../../ResourceForm";
import { updateResourceAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Edit Resource" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data }, { data: cData }] = await Promise.all([
    db
      .from("resources")
      .select(
        "id, org_id, collection_id, title, description, kind, url, file_path, resource_state, tags, created_at, updated_at",
      )
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("resource_collections")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  const resource = (data ?? null) as Resource | null;
  if (!resource) notFound();
  const collections = (cData ?? []) as Pick<ResourceCollection, "id" | "name">[];

  return (
    <>
      <ModuleHeader
        eyebrow="Resource"
        title="Edit Resource"
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Resources", href: "/legend/resources" },
          { label: resource.title, href: `/legend/resources/${resource.id}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <ResourceForm
          action={updateResourceAction.bind(null, resource.id)}
          collections={collections}
          resource={resource}
          submitLabel="Save Resource"
        />
      </div>
    </>
  );
}
