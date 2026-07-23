import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { ResourceCollection } from "@/lib/legend_resources";
import { ResourceForm } from "../ResourceForm";
import { createResourceAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.resources.eyebrow", undefined, "LEG3ND")}
          title={t("console.legend.resources.new.title", undefined, "New Resource")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("resource_collections")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(200);
  const collections = (data ?? []) as Pick<ResourceCollection, "id" | "name">[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.resources.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.resources.new.title", undefined, "New Resource")}
        breadcrumbs={[
          { label: t("console.legend.resources.eyebrow", undefined, "LEG3ND") },
          { label: t("console.legend.resources.title", undefined, "Resources"), href: "/legend/resources" },
          { label: t("console.legend.resources.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <ResourceForm
          action={createResourceAction}
          collections={collections}
          submitLabel={t("console.legend.resources.new.submit", undefined, "Create Resource")}
        />
      </div>
    </>
  );
}
