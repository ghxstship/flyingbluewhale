"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

export type LineItemRow = {
  /** Existing row id, or "" for a freshly-added row. */
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
};

let rowKeySeq = 0;
function blankRow(): LineItemRow & { _key: number } {
  return { _key: ++rowKeySeq, id: "", description: "", quantity: 1, unit_price_cents: 0 };
}

/**
 * InvoiceLineItemsEditor — repeating add/edit/remove rows for
 * invoice_line_items, mounted inside the invoice edit <FormShell>.
 *
 * Each visible row emits indexed field names (`li_id_N`, `li_description_N`,
 * `li_quantity_N`, `li_unit_price_cents_N`) plus a single `li_count` hidden
 * field. The updateInvoice action walks 0..count-1, upserts by
 * (invoice_id, position=N), and deletes any rows whose id is no longer
 * present. Removing a row simply drops it from React state so it stops
 * emitting fields — the action reconciles the delete server-side.
 */
export function InvoiceLineItemsEditor({ initial }: { initial: LineItemRow[] }) {
  const t = useT();
  const [rows, setRows] = useState<(LineItemRow & { _key: number })[]>(
    initial.length > 0
      ? initial.map((r) => ({ ...r, _key: ++rowKeySeq }))
      : [blankRow()],
  );

  function update(key: number, patch: Partial<LineItemRow>) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }
  function remove(key: number) {
    setRows((prev) => prev.filter((r) => r._key !== key));
  }
  function add() {
    setRows((prev) => [...prev, blankRow()]);
  }

  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <legend className="text-xs font-medium text-[var(--p-text-2)]">
        {t("console.finance.invoices.edit.lineItems.legend", undefined, "Line Items")}
      </legend>

      {/* li_count drives the server-side reconciliation loop. */}
      <input type="hidden" name="li_count" value={rows.length} />

      {rows.length === 0 && (
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.finance.invoices.edit.lineItems.empty",
            undefined,
            "No line items. Add one below or leave empty for a flat-amount invoice.",
          )}
        </p>
      )}

      {rows.map((row, i) => (
        <div
          key={row._key}
          className="surface-inset flex flex-col gap-3 rounded-[var(--radius-md)] p-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name={`li_id_${i}`} value={row.id} />
          <div className="flex-1">
            <Input
              label={t("console.finance.invoices.edit.lineItems.description", undefined, "Description")}
              name={`li_description_${i}`}
              value={row.description}
              onChange={(e) => update(row._key, { description: e.target.value })}
              maxLength={500}
              required
            />
          </div>
          <div className="w-full sm:w-24">
            <Input
              label={t("console.finance.invoices.edit.lineItems.quantity", undefined, "Qty")}
              name={`li_quantity_${i}`}
              type="number"
              min={0}
              step="any"
              value={String(row.quantity)}
              onChange={(e) => update(row._key, { quantity: Number(e.target.value) })}
              className="text-right font-mono"
              required
            />
          </div>
          <div className="w-full sm:w-40">
            <MoneyInput
              label={t("console.finance.invoices.edit.lineItems.unitPrice", undefined, "Unit Price")}
              name={`li_unit_price_cents_${i}`}
              defaultCents={row.unit_price_cents}
            />
          </div>
          <div className="sm:pb-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(row._key)}
              aria-label={t("console.finance.invoices.edit.lineItems.remove", undefined, "Remove line")}
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      ))}

      <div>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus size={14} aria-hidden="true" className="me-1.5" />
          {t("console.finance.invoices.edit.lineItems.add", undefined, "Add line")}
        </Button>
      </div>
    </fieldset>
  );
}
