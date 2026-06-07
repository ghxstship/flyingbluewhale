import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateInvoice, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ invoiceId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("invoices", session.orgId, p.invoiceId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateInvoice.bind(null, p.invoiceId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.invoices.edit.eyebrow", undefined, "Invoice")}
        title={t("console.finance.invoices.edit.title", { title: row.title }, `Edit ${row.title}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/finance/invoices/${p.invoiceId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.finance.invoices.edit.fields.title", undefined, "Title")}
            name="title"
            defaultValue={row.title}
            required
            maxLength={200}
          />
          <Input
            label={t("console.finance.invoices.edit.fields.number", undefined, "Number")}
            name="number"
            defaultValue={row.number}
            required
            maxLength={80}
          />
          <Input
            label={t("console.finance.invoices.edit.fields.amountCents", undefined, "Amount — Cents")}
            name="amount_cents"
            type="number"
            defaultValue={String(row.amount_cents ?? 0)}
          />
          <Input
            label={t("console.finance.invoices.edit.fields.currency", undefined, "Currency")}
            name="currency"
            defaultValue={row.currency ?? "USD"}
            required
            maxLength={3}
          />
          <Input
            label={t("console.finance.invoices.edit.fields.issued", undefined, "Issued")}
            name="issued_at"
            type="date"
            defaultValue={dateOnly(row.issued_at)}
          />
          <Input
            label={t("console.finance.invoices.edit.fields.due", undefined, "Due")}
            name="due_at"
            type="date"
            defaultValue={dateOnly(row.due_at)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.finance.invoices.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={5}
              maxLength={4000}
              className="ps-input focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.finance.invoices.edit.statusHint",
              undefined,
              "Status transitions are managed from the detail page.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
