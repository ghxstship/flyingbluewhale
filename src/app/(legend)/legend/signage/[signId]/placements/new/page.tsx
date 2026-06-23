import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { SignageSign } from "@/lib/legend_signage";
import { NewPlacementForm } from "./NewPlacementForm";

export const dynamic = "force-dynamic";

type ProjectOption = { id: string; name: string };

export default async function NewPlacementPage({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: signRow } = await db
    .from("signage_signs")
    .select("id, name, code")
    .eq("id", signId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const sign = (signRow ?? null) as Pick<SignageSign, "id" | "name" | "code"> | null;
  if (!sign) notFound();

  const { data: projectRows } = await db
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const projects = (projectRows ?? []) as ProjectOption[];

  return (
    <>
      <ModuleHeader
        eyebrow={`${sign.code} · ${sign.name}`}
        title="New Placement"
        breadcrumbs={[
          { label: "LEG3ND", href: "/legend/signage" },
          { label: "Signage Library", href: "/legend/signage" },
          { label: sign.name, href: `/legend/signage/${signId}` },
          { label: "New Placement" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewPlacementForm signId={signId} projects={projects} />
      </div>
    </>
  );
}
