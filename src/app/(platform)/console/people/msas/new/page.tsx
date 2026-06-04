import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listCrewMembers } from "@/lib/offer-letters/queries";
import { NewMsaForm } from "./NewMsaForm";

export const dynamic = "force-dynamic";

export default async function NewMsaPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.people.msas.new.eyebrow", undefined, "People · MSAs")}
          title={t("console.people.msas.new.title", undefined, "Issue MSA")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.msas.new.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const crew = await listCrewMembers(session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.msas.new.eyebrow", undefined, "People · MSAs")}
        title={t("console.people.msas.new.title", undefined, "Issue MSA")}
        subtitle={t("console.people.msas.new.subtitle", undefined, "Email the contractor a signing link.")}
      />
      <div className="page-content">
        <NewMsaForm crew={crew} />
      </div>
    </>
  );
}
