"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionBar, Fab, FormScreen, KIcon, RecordDetail, TogRow, type FormDef } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhotoStrip, type StripPhoto } from "@/components/media/PhotoStrip";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatMoney } from "@/lib/i18n/format";
import { toFormData } from "@/lib/mobile/form-data";
import { createListing, updateListing, markSold, withdrawListing, contactSeller } from "./actions";

/** Page condition labels ("Like New"/"For Parts") → the kit `listing` form's
 *  select options ("Like new"/"For parts") so an edit pre-selects correctly. */
const CONDITION_TO_FORM: Record<string, string> = {
  "New": "New",
  "Like New": "Like new",
  "Used": "Used",
  "For Parts": "For parts",
};

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
  /** Signed by the page — `listing-photos` is private, and this view is a
   *  client component with no route to storage. `[]` when none. */
  photos: StripPhoto[];
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
    return formatMoney(cents, { fractionDigits: 0 });
  }
}

/**
 * MarketView — Marketplace client leaf. Renders active listings in the kit
 * `.mkt`/`.mcard` grid; the seller can mark sold / withdraw. "List an Item"
 * opens the kit `listing` FormScreen, serializes its values, and calls the
 * `createListing` server action.
 */
export function MarketView({ listings, labels }: { listings: Listing[]; labels: Labels }) {
  const t = useT();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [detail, setDetail] = useState<Listing | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTx] = useTransition();

  // Kit ActionBar state (canon: ActionBar on every list screen).
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [mineOnly, setMineOnly] = useState(false);
  const [conds, setConds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const condList = useMemo(
    () => Array.from(new Set(listings.map((l) => l.condition).filter(Boolean) as string[])).sort(),
    [listings],
  );
  const toggleCond = (c: string) =>
    setConds((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = listings.filter(
      (l) =>
        (!q || `${l.title} ${l.description ?? ""} ${l.category ?? ""} ${l.seller}`.toLowerCase().includes(q)) &&
        (!mineOnly || l.isMine) &&
        (conds.size === 0 || (l.condition != null && conds.has(l.condition))),
    );
    if (sort === "priceAsc") return filtered.slice().sort((a, b) => (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
    if (sort === "priceDesc") return filtered.slice().sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
    if (sort === "title") return filtered.slice().sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [listings, query, sort, mineOnly, conds]);

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
    // Kit `listing` ids (item/price/cond/desc/photo) → the action's names.
    // Built with toFormData, not the `fd` helper above: that one is typed
    // Record<string, string>, which is exactly why `photo` used to be left
    // out of this object — the File[] had nowhere to go, so a listing's
    // photos were dropped here, before the network, while the form said
    // "2 photos attached". A listing with no picture is one nobody answers.
    const base = {
      title: vals.item ?? "",
      price: vals.price ?? "",
      condition: vals.cond ?? "",
      description: vals.desc ?? "",
      photo: vals.photo,
    };
    const editingId = editing?.id;
    startTx(async () => {
      const res = editingId
        ? await updateListing(null, toFormData({ ...base, id: editingId }))
        : await createListing(null, toFormData(base));
      if (res?.error) {
        setError(res.error);
        return;
      }
      setFormOpen(false);
      setEditing(null);
      flash(editingId ? t("m.market.updated", undefined, "Listing updated") : labels.listed);
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

  if (formOpen || editing) {
    return (
      <>
        {error && (
          <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <FormScreen
          formId="listing"
          initial={
            editing
              ? {
                  item: editing.title,
                  price: editing.priceCents != null ? String(Math.round(editing.priceCents / 100)) : "",
                  cond: editing.condition ? (CONDITION_TO_FORM[editing.condition] ?? editing.condition) : "",
                  desc: editing.description ?? "",
                }
              : undefined
          }
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSubmit={onSubmit}
        />
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

      <ActionBar
        k="mkt"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.market.search", undefined, "Search listings…")}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["recent", t("m.market.sort.recent", undefined, "Recent")],
          ["priceAsc", t("m.market.sort.priceAsc", undefined, "Price: Low First")],
          ["priceDesc", t("m.market.sort.priceDesc", undefined, "Price: High First")],
          ["title", t("m.market.sort.title", undefined, "Name")],
        ]}
        filterActive={conds.size + (mineOnly ? 1 : 0)}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            <TogRow label={t("m.market.filter.mine", undefined, "My Listings")} on={mineOnly} set={() => setMineOnly((v) => !v)} />
            {condList.map((c) => (
              <TogRow key={c} label={c} on={conds.has(c)} set={() => toggleCond(c)} />
            ))}
          </div>
        }
      />


      {listings.length === 0 ? (
        <EmptyState
          icon={<KIcon name="Store" size={32} />}
          title={labels.emptyTitle}
          description={labels.empty}
        />
      ) : visible.length === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "16px 4px" }}>
          {t("m.market.noMatch", undefined, "Nothing matches your search.")}
        </div>
      ) : (
        <div className="mkt">
          {visible.map((l) => (
            <div
              className="mcard"
              key={l.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(l)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(l); } }}
            >
              {/* The thumb slot always rendered a Package glyph, because a
                  listing's photos were dropped before they reached the
                  server. Now it shows the thing being sold. */}
              <div className="mthumb">
                {l.photos[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.photos[0].url}
                    alt={l.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <KIcon name="Package" size={30} style={{ color: "var(--p-text-3)" }} />
                )}
                {l.photos.length > 1 && (
                  <span className="mtag" style={{ left: 6, right: "auto" }}>
                    {l.photos.length}
                  </span>
                )}
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
                    onClick={(e) => { e.stopPropagation(); act(markSold, l.id); }}
                  >
                    {labels.markSold}
                  </button>
                  <button
                    type="button"
                    className="ps-btn ps-btn--ghost ps-btn--sm"
                    disabled={pending}
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={(e) => { e.stopPropagation(); act(withdrawListing, l.id); }}
                  >
                    {labels.withdraw}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* The listing trigger. `labels.listItem` was passed in but consumed
          NOWHERE after the kit-28 port — setFormOpen(true) had zero callers,
          so the FormScreen below was unreachable and nobody could sell
          anything (found by the deployed-target e2e waiting 300s for this
          button). Kit CREATE map: Marketplace → FAB. */}
      <Fab label={labels.listItem} onClick={() => setFormOpen(true)} />

      {detail && (
        <RecordDetail
          title={detail.title}
          icon="Store"
          status={detail.isMine ? { tone: "accent", label: labels.mine } : undefined}
          fields={[
            { k: t("m.market.price", undefined, "Price"), v: money(detail.priceCents, detail.currency) },
            ...(detail.condition ? [{ k: t("m.market.condition", undefined, "Condition"), v: detail.condition }] : []),
            ...(detail.category ? [{ k: t("m.market.category", undefined, "Category"), v: detail.category }] : []),
            { k: t("m.market.seller", undefined, "Seller"), v: detail.isMine ? labels.mine : detail.seller },
            ...(detail.description ? [{ k: t("m.market.desc", undefined, "Description"), v: detail.description, full: true }] : []),
          ]}
          sections={
            detail.photos.length > 0
              ? [{ h: t("m.market.photos", undefined, "Photos"), node: <PhotoStrip photos={detail.photos} /> }]
              : []
          }
          actions={
            detail.isMine
              ? [
                  { label: t("m.market.edit", undefined, "Edit"), icon: "Pencil", primary: true, on: () => { setEditing(detail); setDetail(null); } },
                  { label: labels.markSold, icon: "CheckCircle2", on: () => { act(markSold, detail.id); setDetail(null); } },
                  { label: labels.withdraw, icon: "Archive", on: () => { act(withdrawListing, detail.id); setDetail(null); } },
                ]
              : [
                  {
                    label: t("m.market.contact", undefined, "Message Seller"),
                    icon: "MessageCircle",
                    primary: true,
                    on: () => {
                      const id = detail.id;
                      setError(null);
                      startTx(async () => {
                        const res = await contactSeller(id);
                        if (res.error) { setError(res.error); return; }
                        setDetail(null);
                        if (res.roomId) router.push(`/m/inbox/${res.roomId}`);
                      });
                    },
                  },
                ]
          }
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
