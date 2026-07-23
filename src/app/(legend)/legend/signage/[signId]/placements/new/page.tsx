import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { AccessDenied } from "@/components/ui/AccessDenied";
import type { SignageSign } from "@/lib/legend_signage";
import { NewPlacementForm } from "./NewPlacementForm";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ProjectOption = { id: string; name: string };

export default async function NewPlacementPage({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref={`/legend/signage/${signId}`} />;
  }
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
        title={t("console.legend.signage.placement.title", undefined, "New Placement")}
        breadcrumbs={[
          { label: t("console.legend.signage.eyebrow", undefined, "LEG3ND"), href: "/legend/signage" },
          { label: t("console.legend.signage.title", undefined, "Signage Library"), href: "/legend/signage" },
          { label: sign.name, href: `/legend/signage/${signId}` },
          { label: t("console.legend.signage.placement.title", undefined, "New Placement") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewPlacementForm signId={signId} projects={projects} />
      </div>
    </>
  );
}
