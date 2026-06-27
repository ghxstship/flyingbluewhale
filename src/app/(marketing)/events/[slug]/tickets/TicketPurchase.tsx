"use client";

import { useActionState } from "react";
import { formatMoney } from "@/lib/commerce_store";
import { buyTicketsAction, type State } from "./actions";
import { Button } from "@/components/ui/Button";

export type PurchaseTicketType = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  sales_state: string;
};

export type TicketPurchaseProps = {
  slug: string;
  tickets: PurchaseTicketType[];
  soldOutLabel: string;
};

export function TicketPurchase({ slug, tickets, soldOutLabel }: TicketPurchaseProps) {
  const [state, formAction, pending] = useActionState<State, FormData>(buyTicketsAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      <ul className="divide-y divide-[var(--p-border)] rounded-lg border border-[var(--p-border)]">
        {tickets.map((tt) => {
          const onSale = tt.sales_state === "on_sale";
          return (
            <li key={tt.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--p-text-1)]">{tt.name}</div>
                {tt.description && <p className="text-xs text-[var(--p-text-2)]">{tt.description}</p>}
                <div className="mt-0.5 text-sm font-semibold tabular-nums">{formatMoney(tt.price_cents, tt.currency)}</div>
              </div>
              {onSale ? (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-[var(--p-text-2)]">Qty</span>
                  <input
                    type="number"
                    name={`qty_${tt.id}`}
                    min={0}
                    max={20}
                    defaultValue={0}
                    className="w-16 rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-1.5 text-sm"
                  />
                </label>
              ) : (
                <span className="text-xs font-medium text-[var(--p-text-3)]">{soldOutLabel}</span>
              )}
            </li>
          );
        })}
      </ul>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">Email for tickets</span>
        <input
          type="email"
          name="buyer_email"
          required
          placeholder="you@example.com"
          className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="cta" disabled={pending}>
          {pending ? "Starting checkout…" : "Checkout"}
        </Button>
        {state?.error && <span className="text-sm text-[var(--p-danger-text)]">{state.error}</span>}
      </div>
    </form>
  );
}
