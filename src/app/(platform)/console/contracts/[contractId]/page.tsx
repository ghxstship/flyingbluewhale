import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { deleteContract } from "./actions";

export const dynamic = "force-dynamic";

type Contract = {
  id: string;
  number: string;
  code: string | null;
  title: string;
  kind: string;
  state: string;
  counterparty_name: string | null;
  counterparty_email: string | null;
  total_value_minor: number | null;
  total_value_currency: string | null;
  start_date: string | null;
  end_date: string | null;
  signed_at: string | null;
  notes: string | null;
  description_md: string | null;
};

export default async function ContractDetail({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, number, code, title, kind, state, counterparty_name, counterparty_email, total_value_minor, total_value_currency, start_date, end_date, signed_at, notes, description_md",
    )
    .eq("org_id", session.orgId)
    .eq("id", contractId)
    .is("deleted_at", null)
    .maybeSingle();
  const contract = (data ?? null) as Contract | null;
  if (!contract) notFound();
  const { t } = await getRequestT();

  const label = contract.code ?? contract.number;

  return (
    <>
      <ModuleHeader
        eyebrow={label}
        title={contract.title}
        subtitle={`${formatMoney(contract.total_value_minor, contract.total_value_currency)} · ${toTitle(contract.state.replace(/_/g, " "))}`}
        breadcrumbs={[
          {
            label: t("console.contracts.eyebrow", undefined, "Procurement"),
            href: "/console/contracts",
          },
          {
            label: t("console.contracts.title", undefined, "Contracts"),
            href: "/console/contracts",
          },
          { label },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/console/contracts/${contractId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteContract.bind(null, contractId)}
              confirm={t(
                "console.contracts.deleteConfirm",
                { number: label },
                `Delete contract "${label}"?`,
              )}
              undo={{ table: "contracts", id: contractId, redirectTo: "/console/contracts" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.contracts.columns.kind", undefined, "Kind")}>
            {toTitle(contract.kind.replace(/_/g, " "))}
          </Field>
          <Field label={t("console.contracts.columns.state", undefined, "State")}>
            <StatusBadge status={contract.state} />
          </Field>
          <Field label={t("console.contracts.columns.value", undefined, "Value")} mono>
            {formatMoney(contract.total_value_minor, contract.total_value_currency)}
          </Field>
          <Field label={t("console.contracts.columns.counterparty", undefined, "Counterparty")}>
            {contract.counterparty_name ?? "—"}
          </Field>
          <Field label={t("console.contracts.fields.counterpartyEmail", undefined, "Counterparty Email")} mono>
            {contract.counterparty_email ?? "—"}
          </Field>
          <Field label={t("console.contracts.fields.number", undefined, "Number")} mono>
            {contract.number}
          </Field>
          <Field label={t("console.contracts.fields.start", undefined, "Start")}>{contract.start_date ?? "—"}</Field>
          <Field label={t("console.contracts.fields.end", undefined, "End")}>{contract.end_date ?? "—"}</Field>
          <Field label={t("console.contracts.fields.signed", undefined, "Signed")}>{contract.signed_at ?? "—"}</Field>
        </div>
        {contract.description_md && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">
              {t("console.contracts.fields.description", undefined, "Description")}
            </h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{contract.description_md}</p>
          </div>
        )}
        {contract.notes && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">{t("console.contracts.fields.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{contract.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{children}</div>
    </div>
  );
}
