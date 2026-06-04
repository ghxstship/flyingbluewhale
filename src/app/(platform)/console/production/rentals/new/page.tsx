import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewRentalForm } from "./NewRentalForm";

export const dynamic = "force-dynamic";

export default async function NewRentalPage() {
  const { t } = await getRequestT();
  let equipment: { id: string; name: string }[] = [];
  let projects: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const [eq, ps] = await Promise.all([
      listOrgScoped("equipment", session.orgId, { orderBy: "name", ascending: true }),
      listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }),
    ]);
    equipment = eq.map((x) => ({ id: x.id, name: x.name }));
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.rentals.new.eyebrow", undefined, "Production")}
        title={t("console.production.rentals.new.title", undefined, "New Rental")}
      />
      <div className="page-content max-w-xl">
        <NewRentalForm equipment={equipment} projects={projects} />
      </div>
    </>
  );
}
