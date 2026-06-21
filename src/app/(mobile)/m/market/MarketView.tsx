"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormScreen, KIcon, type FormDef } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { createListing, markSold, withdrawListing } from "./actions";

export type Listing = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number | null;
  currency: string;
  condition: string | null;
  category: string | null;
  seller: string;
  isMine: boolean;
};

type Labels = {
  listItem: string;
  emptyTitle: string;
  empty: string;
  listed: string;
  markSold: string;
  withdraw: string;
  mine: string;
  by: string;
};

function money(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100).toLocaleString()}`;
  }
}

/**
 * MarketView — Marketplace client leaf. Renders active listings in the kit
 * `.mkt`/`.mcard` grid; the seller can mark sold / withdraw. "List an Item"
 * opens the kit `listing` FormScreen, serializes its values, and calls the
 * `createListing` server action.
 */
export function MarketView({ listings, labels }: { listings: Listing[]; labels: Labels }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTx] = useTransition();

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fd = (entries: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.set(k, v);
    return f;
  };

  const onSubmit = (_def: FormDef, vals: Record<string, unknown>) => {
    if (pending) return;
    setError(null);
    // Kit `listing` form ids: item, price, cond, desc, photo.
    const payload = fd({
      title: String(vals.item ?? ""),
      price: String(vals.price ?? ""),
      condition: String(vals.cond ?? ""),
      description: String(vals.desc ?? ""),
    });
    startTx(async () => {
      const res = await createListing(null, payload);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setFormOpen(false);
      flash(labels.listed);
      router.refresh();
    });
  };

  const act = (action: (p: null, f: FormData) => Promise<{ error?: string } | null>, id: string) => {
    setError(null);
    startTx(async () => {
      const res = await action(null, fd({ id }));
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  if (formOpen) {
    return (
      <>
        {error && (
          <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <FormScreen formId="listing" onClose={() => setFormOpen(false)} onSubmit={onSubmit} />
      </>
    );
  }

  return (
    <>
      {toast && (
        <div
          className="ps-badge ps-badge--ok"
          role="status"
          style={{ display: "block", marginBottom: 12 }}
        >
          {toast}
        </div>
      )}
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <Button variant="cta" size="sm" onClick={() => setFormOpen(true)}>
          <KIcon name="Plus" size={14} /> {labels.listItem}
        </Button>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<KIcon name="Store" size={32} />}
          title={labels.emptyTitle}
          description={labels.empty}
        />
      ) : (
        <div className="mkt">
          {listings.map((l) => (
            <div className="mcard" key={l.id}>
              <div className="mthumb">
                <KIcon name="Package" size={30} style={{ color: "var(--p-text-3)" }} />
                {l.category && <span className="mtag">{l.category}</span>}
              </div>
              <div className="t" style={{ fontSize: 13, marginTop: 7 }}>
                {l.title}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>{money(l.priceCents, l.currency)}</span>
                {l.condition && <span className="ps-badge ps-badge--neutral">{l.condition}</span>}
              </div>
              <div className="s" style={{ fontSize: 11, marginTop: 4 }}>
                {l.isMine ? labels.mine : `${labels.by} ${l.seller}`}
              </div>
              {l.isMine && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    className="ps-btn ps-btn--secondary ps-btn--sm"
                    disabled={pending}
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => act(markSold, l.id)}
                  >
                    {labels.markSold}
                  </button>
                  <button
                    type="button"
                    className="ps-btn ps-btn--ghost ps-btn--sm"
                    disabled={pending}
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => act(withdrawListing, l.id)}
                  >
                    {labels.withdraw}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
