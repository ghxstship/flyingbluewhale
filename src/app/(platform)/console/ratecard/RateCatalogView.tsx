"use client";

import { useState, useMemo } from "react";
import type { RateCardItem } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { X, Plus, Calculator, Search } from "lucide-react";

function cents(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n / 100);
}

type EstimatorLine = { item: RateCardItem; qty: number };

export function RateCatalogView({ items }: { items: RateCardItem[] }) {
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<string>("all");
  const [estimator, setEstimator] = useState<EstimatorLine[]>([]);
  const [showEstimator, setShowEstimator] = useState(false);

  const catalogs = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.catalog));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      const matchCat = catalog === "all" || i.catalog === catalog;
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q);
      return matchCat && matchQ && i.active;
    });
  }, [items, search, catalog]);

  const totalCents = useMemo(
    () => estimator.reduce((sum, l) => sum + l.item.unit_price_cents * l.qty, 0),
    [estimator],
  );

  function addToEstimator(item: RateCardItem) {
    setEstimator((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { item, qty: 1 }];
    });
    setShowEstimator(true);
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      setEstimator((prev) => prev.filter((l) => l.item.id !== id));
    } else {
      setEstimator((prev) => prev.map((l) => (l.item.id === id ? { ...l, qty } : l)));
    }
  }

  return (
    <div className="page-content space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base w-full pl-8 text-sm"
          />
        </div>
        <Button
          size="sm"
          variant={showEstimator ? "primary" : "secondary"}
          onClick={() => setShowEstimator((v) => !v)}
        >
          <Calculator size={14} className="mr-1.5" />
          Estimator{estimator.length > 0 && ` (${estimator.length})`}
        </Button>
      </div>

      {/* Catalog tabs */}
      <div className="flex flex-wrap gap-1.5">
        {["all", ...catalogs].map((c) => (
          <button
            key={c}
            onClick={() => setCatalog(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              catalog === c
                ? "border-[var(--org-primary)] bg-[var(--org-primary)] text-white"
                : "border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--org-primary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {c === "all" ? "All catalogs" : c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Rate table */}
        <div className="surface overflow-hidden">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name / Description</th>
                <th>Catalog</th>
                <th className="text-right">Unit Price</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[var(--text-muted)]">
                    {search ? `No rates match "${search}"` : "No rate items in this catalog."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="group">
                    <td>
                      <span className="font-mono text-xs text-[var(--text-muted)]">{item.sku}</span>
                    </td>
                    <td>
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td>
                      <Badge variant="muted" size="sm">
                        {item.catalog}
                      </Badge>
                    </td>
                    <td className="text-right font-mono text-sm tabular-nums">
                      {cents(item.unit_price_cents, item.currency)}
                    </td>
                    <td>
                      <button
                        onClick={() => addToEstimator(item)}
                        title="Add to estimator"
                        className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] transition-opacity"
                      >
                        <Plus size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Estimator panel */}
        {showEstimator && (
          <div className="surface p-4 space-y-4 self-start">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Labor Cost Estimator</span>
              <button onClick={() => setShowEstimator(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            </div>

            {estimator.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                Click <Plus size={11} className="inline" /> on any rate item to add it here.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {estimator.map(({ item, qty }) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{item.name}</div>
                        <div className="text-xs text-[var(--text-muted)] font-mono">
                          {cents(item.unit_price_cents, item.currency)} × {qty}
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0)}
                        className="input-base w-16 text-right text-xs"
                      />
                      <button
                        onClick={() => updateQty(item.id, 0)}
                        className="text-[var(--text-muted)] hover:text-[var(--color-error)]"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Estimated total</span>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {cents(totalCents)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const lines = estimator
                        .map((l) => `${l.item.name}\t${l.qty}\t${cents(l.item.unit_price_cents * l.qty)}`)
                        .join("\n");
                      navigator.clipboard.writeText(`${lines}\n\nTotal\t\t${cents(totalCents)}`);
                    }}
                  >
                    Copy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEstimator([])}>
                    Clear
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!showEstimator && items.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {filtered.length} of {items.length} active rate items · Hover a row and click <Plus size={10} className="inline" /> to add to the estimator
        </p>
      )}
    </div>
  );
}
