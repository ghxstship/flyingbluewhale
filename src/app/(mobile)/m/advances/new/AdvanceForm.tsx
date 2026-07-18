"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crumbs, FormScreen } from "@/components/mobile/kit";
import type { FormDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { requestAdvance } from "../actions";

/**
 * Client wrapper around the kit `advance` FormScreen. Collects the form
 * values, serializes to FormData and calls the `requestAdvance` server
 * action, then navigates back to the advances list on success.
 */
export function AdvanceForm({
  initial,
  catalogItemId,
  fromCatalog = false,
  catalogItemName,
}: {
  initial?: Record<string, unknown>;
  /** Kit 31 #3 — the concrete SKU the catalog CTA handed through. */
  catalogItemId?: string;
  fromCatalog?: boolean;
  /** Kit 32 C1 — the SKU name for the More → Catalog → Item crumb trail. */
  catalogItemName?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const prefilled = !fromCatalog && !!initial && Object.keys(initial).length > 0;

  const close = () => router.push("/m/advances");

  const submit = (_def: FormDef, vals: Record<string, unknown>) => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    for (const [k, v] of Object.entries(vals)) {
      if (v != null) fd.set(k, String(v));
    }
    if (catalogItemId) fd.set("catalogItemId", catalogItemId);
    startTransition(async () => {
      const res = await requestAdvance(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/m/advances");
      router.refresh();
    });
  };

  return (
    <div className="screen screen-anim">
      {/* Kit 32 C1: the catalog-item path gets its full trail. */}
      {fromCatalog && (
        <Crumbs
          items={[
            { label: t("m.catalog.back", undefined, "More"), href: "/m/more" },
            { label: t("m.catalog.title", undefined, "Catalog"), href: "/m/catalog" },
            { label: catalogItemName ?? t("m.advances.new.crumbItem", undefined, "Item") },
          ]}
        />
      )}
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      {fromCatalog && (
        <p className="hint" style={{ marginBottom: 8 }}>
          {t("m.advances.new.fromCatalog", undefined, "Prefilled from the catalog — set the dates and quantity.")}
        </p>
      )}
      {prefilled && (
        <p className="hint" style={{ marginBottom: 8 }}>
          {t("m.advances.new.prefilled", undefined, "Prefilled from your last request — edit anything that's changed.")}
        </p>
      )}
      <FormScreen formId="advance" initial={initial} onClose={close} onSubmit={submit} />
      {pending && (
        <p className="hint" style={{ marginTop: 8 }}>
          {t("m.advances.new.submitting", undefined, "Submitting…")}
        </p>
      )}
    </div>
  );
}
