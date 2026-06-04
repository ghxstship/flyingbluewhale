import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewInvoiceForm } from "./NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const { t } = await getRequestT();
  let clients: { id: string; name: string }[] = [];
  let projects: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const [cs, ps] = await Promise.all([
      listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true }),
      listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }),
    ]);
    clients = cs.map((c) => ({ id: c.id, name: c.name }));
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.invoices.new.title", undefined, "New Invoice")}
      />
      <div className="page-content max-w-2xl">
        <NewInvoiceForm clients={clients} projects={projects} />
      </div>
    </>
  );
}
