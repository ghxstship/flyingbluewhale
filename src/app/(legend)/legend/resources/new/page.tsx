import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { ResourceCollection } from "@/lib/legend_resources";
import { ResourceForm } from "../ResourceForm";
import { createResourceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="New Resource" />
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
        eyebrow="LEG3ND"
        title="New Resource"
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Resources", href: "/legend/resources" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <ResourceForm action={createResourceAction} collections={collections} submitLabel="Create Resource" />
      </div>
    </>
  );
}
