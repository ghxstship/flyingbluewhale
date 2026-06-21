"use client";

import { useState } from "react";
import { FormScreen, KIcon, type FormDef } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * MarketView — Marketplace client leaf. The schema carries no peer-to-peer
 * listings table, so this is an honest zero state: the kit `.mkt` grid would
 * render here once a table exists. "List an item" opens the kit `listing`
 * FormScreen; onSubmit is a stub toast until the backing table lands.
 *
 * Design truth: prototype market tab (app.jsx 2284-2332) + LISTINGS (854-861).
 */

export function MarketView() {
  const t = useT();
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onSubmit = (_def: FormDef, _vals: Record<string, unknown>) => {
    setFormOpen(false);
    setToast(t("m.market.listed", undefined, "Listing saved · pending marketplace launch"));
    setTimeout(() => setToast(null), 3000);
  };

  if (formOpen) {
    return <FormScreen formId="listing" onClose={() => setFormOpen(false)} onSubmit={onSubmit} />;
  }

  return (
    <>
      {toast && (
        <div className="ps-badge ps-badge--ok" role="status" style={{ display: "block", marginBottom: 12 }}>
          {toast}
        </div>
      )}
      <EmptyState
        icon={<KIcon name="Store" size={32} />}
        title={t("m.market.emptyTitle", undefined, "No Listings Yet")}
        description={t(
          "m.market.empty",
          undefined,
          "The crew marketplace is coming online. Be the first to list gear, tools, or apparel.",
        )}
        action={
          <Button variant="cta" size="sm" onClick={() => setFormOpen(true)}>
            <KIcon name="Plus" size={14} /> {t("m.market.listItem", undefined, "List an Item")}
          </Button>
        }
      />
    </>
  );
}
