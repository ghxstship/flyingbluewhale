import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewInvoiceForm } from "./NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { t } = await getRequestT();
  const { clientId: defaultClientId } = await searchParams;
  // FK candidates are searched on demand through RecordCombobox (audit
  // A-06) — no preloaded capped dump. Only the deep-linked default client
  // needs its label resolved server-side.
  let defaultClientName: string | undefined;
  if (hasSupabase && defaultClientId) {
    const session = await requireSession();
    const client = await getOrgScoped("clients", session.orgId, defaultClientId);
    defaultClientName = client?.name;
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.invoices.new.title", undefined, "New Invoice")}
      />
      <div className="page-content max-w-2xl">
        <NewInvoiceForm
          defaultClientId={defaultClientName ? defaultClientId : undefined}
          defaultClientName={defaultClientName}
        />
      </div>
    </>
  );
}
