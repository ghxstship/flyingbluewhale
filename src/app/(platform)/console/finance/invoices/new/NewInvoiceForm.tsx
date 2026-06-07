"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createInvoiceAction } from "../actions";

export function NewInvoiceForm({
  clients,
  projects,
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const t = useT();
  return (
    <FormShell
      action={createInvoiceAction}
      cancelHref="/console/finance/invoices"
      submitLabel={t("console.finance.invoices.new.submit", undefined, "Create Invoice")}
    >
      <Input
        label={t("console.finance.invoices.new.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        placeholder={t("console.finance.invoices.new.titlePlaceholder", undefined, "Event production retainer")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.finance.invoices.new.client", undefined, "Client")}
          </label>
          <select name="client_id" className="ps-input mt-1.5 w-full">
            <option value="">{t("console.finance.invoices.new.noClient", undefined, "— No client —")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.finance.invoices.new.project", undefined, "Project")}
          </label>
          <select name="project_id" className="ps-input mt-1.5 w-full">
            <option value="">{t("console.finance.invoices.new.noProject", undefined, "— No project —")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label={t("console.finance.invoices.new.amount", undefined, "Amount")}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          required
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.finance.invoices.new.currency", undefined, "Currency")}
          </label>
          <select name="currency" defaultValue="USD" className="ps-input mt-1.5 w-full">
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
          </select>
        </div>
        <Input label={t("console.finance.invoices.new.due", undefined, "Due")} name="due_at" type="date" />
      </div>
      <Input label={t("console.finance.invoices.new.issued", undefined, "Issued")} name="issued_at" type="date" />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.finance.invoices.new.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
