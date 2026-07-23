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
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.resources.eyebrow", undefined, "LEG3ND")}
          title={t("console.legend.resources.edit.title", undefined, "Edit Resource")}
        />
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
        eyebrow={t("console.legend.resources.detail.eyebrow", undefined, "Resource")}
        title={t("console.legend.resources.edit.title", undefined, "Edit Resource")}
        breadcrumbs={[
          { label: t("console.legend.resources.eyebrow", undefined, "LEG3ND") },
          { label: t("console.legend.resources.title", undefined, "Resources"), href: "/legend/resources" },
          { label: resource.title, href: `/legend/resources/${resource.id}` },
          { label: t("console.legend.resources.edit.breadcrumb", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <ResourceForm
          action={updateResourceAction.bind(null, resource.id)}
          collections={collections}
          resource={resource}
          submitLabel={t("console.legend.resources.edit.submit", undefined, "Save Resource")}
        />
      </div>
    </>
  );
}
