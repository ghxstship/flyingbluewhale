import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import { NewBeoForm } from "./NewBeoForm";

export const dynamic = "force-dynamic";

type ClientRow = { id: string; name: string };
type ProjectRow = { id: string; name: string };

export default async function NewBeoPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.sales.beos.new.title", undefined, "New BEO")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const [clients, projects] = await Promise.all([
    listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true }) as unknown as Promise<ClientRow[]>,
    listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }) as unknown as Promise<ProjectRow[]>,
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sales.beos.eyebrow", undefined, "Sales")}
        title={t("console.sales.beos.new.title", undefined, "New BEO")}
        breadcrumbs={[
          { label: t("console.sales.beos.eyebrow", undefined, "Sales"), href: "/studio/sales/beos" },
          { label: t("console.sales.beos.title", undefined, "BEOs"), href: "/studio/sales/beos" },
          { label: t("console.sales.beos.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewBeoForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </>
  );
}
