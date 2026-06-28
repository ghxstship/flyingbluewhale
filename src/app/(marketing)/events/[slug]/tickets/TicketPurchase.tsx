"use client";

import { useActionState, useMemo, useState } from "react";
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
  remaining: number;
};

export type TicketPurchaseProps = {
  slug: string;
  tickets: PurchaseTicketType[];
  soldOutLabel: string;
};

const MAX_PER_TYPE = 20;

export function TicketPurchase({ slug, tickets, soldOutLabel }: TicketPurchaseProps) {
  const [state, formAction, pending] = useActionState<State, FormData>(buyTicketsAction, null);
  const [qty, setQty] = useState<Record<string, number>>({});

  const currency = tickets[0]?.currency ?? "USD";

  const { total, count } = useMemo(() => {
    let cents = 0;
    let items = 0;
    for (const tt of tickets) {
      const n = qty[tt.id] ?? 0;
      cents += n * tt.price_cents;
      items += n;
    }
    return { total: cents, count: items };
  }, [qty, tickets]);

  function setQ(id: string, next: number, ceiling: number) {
    const clamped = Math.max(0, Math.min(ceiling, next));
    setQty((prev) => ({ ...prev, [id]: clamped }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      <ul className="divide-y divide-[var(--p-border)] rounded-lg border border-[var(--p-border)]">
        {tickets.map((tt) => {
          const onSale = tt.sales_state === "on_sale" && tt.remaining > 0;
          const ceiling = Math.min(MAX_PER_TYPE, tt.remaining);
          const current = qty[tt.id] ?? 0;
          return (
            <li key={tt.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--p-text-1)]">{tt.name}</div>
                {tt.description && <p className="text-xs text-[var(--p-text-2)]">{tt.description}</p>}
                <div className="mt-0.5 text-sm font-semibold tabular-nums">
                  {formatMoney(tt.price_cents, tt.currency)}
                </div>
                {onSale && (
                  <div className="mt-0.5 text-xs text-[var(--p-text-3)]">{tt.remaining} remaining</div>
                )}
              </div>
              {onSale ? (
                <div className="flex items-center gap-2">
                  {/* Server reads qty_<id>; the stepper drives this hidden field. */}
                  <input type="hidden" name={`qty_${tt.id}`} value={current} />
                  <button
                    type="button"
                    aria-label={`Remove one ${tt.name}`}
                    onClick={() => setQ(tt.id, current - 1, ceiling)}
                    disabled={current <= 0}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--p-border)] text-[var(--p-text-1)] disabled:opacity-40 hover:bg-[var(--p-surface-2)]"
                  >
                    &minus;
                  </button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">{current}</span>
                  <button
                    type="button"
                    aria-label={`Add one ${tt.name}`}
                    onClick={() => setQ(tt.id, current + 1, ceiling)}
                    disabled={current >= ceiling}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--p-border)] text-[var(--p-text-1)] disabled:opacity-40 hover:bg-[var(--p-surface-2)]"
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-[var(--p-text-3)]">{soldOutLabel}</span>
              )}
            </li>
          );
        })}
      </ul>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">Name on the pass</span>
        <input
          type="text"
          name="buyer_name"
          autoComplete="name"
          placeholder="Your name"
          className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
        />
      </label>

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--p-text-2)]">
          <span className="font-semibold tabular-nums text-[var(--p-text-1)]">{formatMoney(total, currency)}</span>
          {count > 0 && <span className="ml-1.5 text-xs">{count === 1 ? "1 ticket" : `${count} tickets`}</span>}
        </div>
        <Button type="submit" variant="cta" disabled={pending || count === 0}>
          {pending ? "Starting checkout" : "Checkout"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-[var(--p-danger-text)]">{state.error}</p>}
    </form>
  );
}
