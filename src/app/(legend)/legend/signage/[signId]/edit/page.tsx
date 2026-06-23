import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { SignageSign } from "@/lib/legend_signage";
import { NewSignForm } from "../../new/NewSignForm";
import { updateSignAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditSignPage({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Edit Sign" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data } = await db
    .from("signage_signs")
    .select("*")
    .eq("id", signId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  const sign = (data ?? null) as SignageSign | null;
  if (!sign) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow="Sign"
        title="Edit Sign"
        breadcrumbs={[
          { label: "LEG3ND", href: "/legend/signage" },
          { label: "Signage Library", href: "/legend/signage" },
          { label: sign.name, href: `/legend/signage/${sign.id}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewSignForm
          action={updateSignAction.bind(null, sign.id)}
          sign={sign}
          submitLabel="Save Sign"
        />
      </div>
    </>
  );
}
