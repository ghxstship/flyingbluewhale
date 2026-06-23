import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { NewContractForm, type ContractFormInitial } from "../../new/NewContractForm";
import { updateContract } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditContractPage({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data: c } = await supabase
    .from("contracts")
    .select(
      "id, title, kind, state, number, counterparty_name, counterparty_email, total_value_minor, total_value_currency, start_date, end_date, notes",
    )
    .eq("id", contractId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!c) notFound();

  const day = (d: string | null | undefined) => (d ? String(d).slice(0, 10) : undefined);
  const initial: ContractFormInitial = {
    title: c.title ?? undefined,
    kind: c.kind ?? undefined,
    state: c.state ?? undefined,
    number: c.number ?? undefined,
    counterparty_name: c.counterparty_name ?? undefined,
    counterparty_email: c.counterparty_email ?? undefined,
    total_value_minor: c.total_value_minor ?? undefined,
    total_value_currency: c.total_value_currency ?? undefined,
    start_date: day(c.start_date),
    end_date: day(c.end_date),
    notes: c.notes ?? undefined,
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.contracts.eyebrow", undefined, "Contracts")}
        title={t("console.contracts.edit.title", undefined, "Edit Contract")}
        subtitle={c.number ?? c.title ?? undefined}
        breadcrumbs={[
          { label: t("console.contracts.eyebrow", undefined, "Contracts"), href: "/studio/contracts" },
          { label: c.number ?? c.title ?? contractId, href: `/studio/contracts/${contractId}` },
          { label: t("common.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewContractForm
          action={updateContract.bind(null, contractId)}
          submitLabel={t("common.saveChanges", undefined, "Save changes")}
          initial={initial}
        />
      </div>
    </>
  );
}
