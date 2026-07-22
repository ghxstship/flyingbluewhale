import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createPositionAction } from "../actions";
import { PositionForm, type Department } from "../PositionForm";

export const dynamic = "force-dynamic";

export default async function NewPositionPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="New Position" />
        <ConfigureSupabase />
      </>
    );
  }
  await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: departmentData } = await db
    .from("dim_department")
    .select("code, label")
    .order("code", { ascending: true })
    .limit(20);
  const departments = (departmentData ?? []) as Department[];

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title="New Position"
        subtitle="Add a position to the library. Rosters and role assignment read from here."
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Organization", href: "/legend/hub/organization" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <PositionForm action={createPositionAction} departments={departments} submitLabel="Create Position" />
      </div>
    </>
  );
}
