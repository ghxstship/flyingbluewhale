"use client";

import { useActionState, useMemo, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useFormatters } from "@/lib/i18n/LocaleProvider";
import { productLineSubtitle } from "@/lib/scan/product";
import type { ProductAdvanceLine, ResolvedScan } from "@/lib/scan/types";
import {
  bindGtinToCatalogItem,
  confirmProductFulfillment,
  type BindGtinState,
  type ConfirmFulfillmentState,
} from "./actions";

/**
 * POS product-match result card (kit 30) + the unknown-GTIN bind affordance.
 *
 * Rendered by `CheckInScanner` inside the shared Scan surface's result slot —
 * same `.item` card idiom as every other verdict, plus one card per open
 * approved advance line with a per-line Confirm Fulfillment action
 * (approved → delivered via the FSM-enforcing server action, provenance
 * `fulfilled_via: 'scan'`). Confirmations announce through the `role="status"`
 * live-region idiom the field surfaces use (clock, briefings).
 */

export type ProductScan = Extract<ResolvedScan, { result: "product" }>;

export type BindableCatalogItem = { id: string; label: string };

export type ProductLabels = {
  match: string;
  matchedCatalog: string;
  approved: string;
  fulfilled: string;
  confirm: string;
  confirming: string;
  confirmed: string;
  noLines: string;
  bindHint: string;
  bindItemLabel: string;
  bindSearchPlaceholder: string;
  bindEmpty: string;
  bindCta: string;
  binding: string;
  bound: string;
};

const KIND_ICON: Record<string, string> = {
  vehicle: "Car",
  catering: "Utensils",
  radio: "Radio",
  credential: "BadgeCheck",
  ticket: "Ticket",
  uniform: "Shirt",
  travel: "Plane",
  lodging: "BedDouble",
  tool: "Wrench",
  equipment: "Package",
  labor: "HardHat",
};

function AdvanceLineCard({
  line,
  displayName,
  canFulfill,
  labels,
}: {
  line: ProductAdvanceLine;
  displayName: string;
  canFulfill: boolean;
  labels: ProductLabels;
}) {
  const [state, formAction, pending] = useActionState<ConfirmFulfillmentState, FormData>(
    confirmProductFulfillment,
    null,
  );
  const fmt = useFormatters();
  const done = state?.ok === true;
  const deadline = line.deadline ? fmt.dateParts(line.deadline, { month: "short", day: "numeric" }) : null;
  const subtitle = productLineSubtitle([line.partyName, line.projectName, deadline]);

  return (
    <div>
      <div className="item">
        <KIcon name={done ? "PackageCheck" : "PackageOpen"} size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{line.title ?? displayName}</div>
          {subtitle && <div className="s">{subtitle}</div>}
        </div>
        <span className={`ps-badge ps-badge--${done ? "ok" : "info"}`}>
          {done ? labels.fulfilled : labels.approved}
        </span>
      </div>
      {canFulfill && !done && (
        <form action={formAction}>
          <input type="hidden" name="assignmentId" value={line.assignmentId} />
          <button
            type="submit"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
            disabled={pending}
          >
            <KIcon name="PackageCheck" size={16} /> {pending ? labels.confirming : labels.confirm}
          </button>
        </form>
      )}
      {state?.error && (
        <div className="ps-alert ps-alert--warning" role="status" style={{ marginBottom: 10 }}>
          {state.error}
        </div>
      )}
      {done && (
        <div className="ps-alert ps-alert--success" role="status" style={{ marginBottom: 10 }}>
          {labels.confirmed} · {line.title ?? displayName}
          {line.partyName ? ` · ${line.partyName}` : ""}
        </div>
      )}
    </div>
  );
}

export function ProductMatchCard({
  product,
  canFulfill,
  labels,
}: {
  product: ProductScan;
  canFulfill: boolean;
  labels: ProductLabels;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="item" style={{ borderColor: "color-mix(in oklab, var(--p-success) 45%, var(--p-border))" }}>
        <KIcon name={KIND_ICON[product.catalogKind] ?? "Package"} size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{product.displayName}</div>
          <div className="s" style={{ fontFamily: "var(--p-mono)" }}>
            {product.gtin14} · {labels.matchedCatalog}
          </div>
        </div>
        <span className="ps-badge ps-badge--ok">{labels.match}</span>
      </div>
      {product.openLines.length === 0 ? (
        <div className="hint" style={{ padding: "4px 4px 8px" }}>
          {labels.noLines}
        </div>
      ) : (
        product.openLines.map((line) => (
          <AdvanceLineCard
            key={line.assignmentId}
            line={line}
            displayName={product.displayName}
            canFulfill={canFulfill}
            labels={labels}
          />
        ))
      )}
    </div>
  );
}

/**
 * Unknown-GTIN bind affordance: a valid retail barcode came back `not_found`
 * on the POS segment. Manager-band only (`people:manage`); picks one of the
 * org's catalog items and writes the `catalog_item_gtins` binding so the next
 * scan resolves. The miss is already journaled by the resolver — this is the
 * queue's fast path, not a replacement for it.
 */
export function BindGtinCard({
  code,
  catalogItems,
  labels,
}: {
  code: string;
  catalogItems: BindableCatalogItem[];
  labels: ProductLabels;
}) {
  const [state, formAction, pending] = useActionState<BindGtinState, FormData>(bindGtinToCatalogItem, null);
  const [query, setQuery] = useState("");
  const [itemId, setItemId] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [catalogItems, query]);

  if (state?.ok) {
    return (
      <div className="ps-alert ps-alert--success" role="status" style={{ marginTop: 10 }}>
        {labels.bound} · {code}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div className="import-note">
        <KIcon name="Link2" size={15} style={{ color: "var(--p-accent-text)", flex: "none", marginTop: 1 }} />
        <span style={{ fontSize: 12 }}>{labels.bindHint}</span>
      </div>
      <form action={formAction}>
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="catalogItemId" value={itemId} />
        <div className="fld" style={{ marginTop: 8 }}>
          <label className="wl" htmlFor="bind-gtin-search">
            {labels.bindItemLabel}
          </label>
          <input
            id="bind-gtin-search"
            className="ps-input"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.bindSearchPlaceholder}
          />
        </div>
        <div
          style={{
            maxHeight: 200,
            overflowY: "auto",
            border: "1px solid var(--p-border)",
            borderRadius: "var(--p-r-md)",
          }}
        >
          {filtered.slice(0, 50).map((item) => (
            <button
              key={item.id}
              type="button"
              className="item"
              onClick={() => setItemId(item.id)}
              style={{
                width: "100%",
                textAlign: "left",
                margin: 0,
                borderRadius: 0,
                border: "none",
                borderBottom: "1px solid var(--p-border)",
                boxShadow: "none",
                cursor: "pointer",
                background: item.id === itemId ? "color-mix(in oklab, var(--p-accent) 12%, transparent)" : undefined,
              }}
            >
              <div className="t" style={{ flex: 1, minWidth: 0 }}>
                {item.label}
              </div>
              {item.id === itemId && <KIcon name="Check" size={15} style={{ color: "var(--p-accent-text)" }} />}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="hint" style={{ padding: 12, textAlign: "center" }}>
              {labels.bindEmpty}
            </div>
          )}
        </div>
        {state?.error && (
          <div className="ps-alert ps-alert--warning" role="status" style={{ marginTop: 8 }}>
            {state.error}
          </div>
        )}
        <button
          type="submit"
          className="ps-btn ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
          disabled={pending || !itemId}
        >
          <KIcon name="Link2" size={16} /> {pending ? labels.binding : labels.bindCta}
        </button>
      </form>
    </div>
  );
}
