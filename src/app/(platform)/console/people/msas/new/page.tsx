import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listCrewMembers } from "@/lib/offer-letters/queries";
import { NewMsaForm } from "./NewMsaForm";

export const dynamic = "force-dynamic";

export default async function NewMsaPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="People · MSAs" title="Issue MSA" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const crew = await listCrewMembers(session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow="People · MSAs"
        title="Issue MSA"
        subtitle="Generates a public link + 6-character access code. Email the link to the contractor; they fill Exhibits B/C and sign."
      />
      <div className="page-content">
        <NewMsaForm crew={crew} />
      </div>
    </>
  );
}
