"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crumbs, FormScreen } from "@/components/mobile/kit";
import type { FormDef, FormField } from "@/components/mobile/kit";
import { CATALOG_KINDS, CATALOG_KIND_LABEL, type CatalogKind } from "@/lib/db/catalog-kinds";
import { useT } from "@/lib/i18n/LocaleProvider";
import { requestAdvance } from "../actions";

/** A requestable SKU handed down from the server page. */
export type CatalogPick = { id: string; kind: CatalogKind; code: string; name: string };

/** Display string for the item lookup — name first (what crew search by),
 *  code as the disambiguator. `code` is org-unique, so this is 1:1 with id. */
const itemDisplay = (c: CatalogPick) => `${c.name} · ${c.code}`;

/**
 * Client wrapper around the kit `advance` FormScreen. Unlike the ported
 * prototype form (free-text item → find-or-create SKU), the item is now a
 * catalog lookup **filtered by the selected Category**:
 *
 *  - Category is driven by the real `catalog_kind` families present in the
 *    org catalog. Picking one narrows the Item select to that kind's SKUs.
 *  - Item is a strict select (an unknown name can't spawn a SKU by typo).
 *  - "Special order" is the explicit escape hatch for an item that isn't in
 *    the catalog yet — the action mints an inactive SKU pending approval.
 *
 * The def is rebuilt as Category / Special-order change; FormScreen keeps its
 * own values, so nothing the crew already typed is lost across rebuilds.
 */
export function AdvanceForm({
  catalog,
  initial,
  catalogItemId,
  fromCatalog = false,
  catalogItemName,
}: {
  catalog: CatalogPick[];
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

  // The SKU the catalog CTA bound (if any) — seeds Category + Item.
  const boundItem = useMemo(
    () => (catalogItemId ? catalog.find((c) => c.id === catalogItemId) : undefined),
    [catalog, catalogItemId],
  );

  // display ⇄ id and label ⇄ kind lookups.
  const displayToId = useMemo(() => new Map(catalog.map((c) => [itemDisplay(c), c.id])), [catalog]);
  const idToItem = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const labelToKind = useMemo(() => {
    const m = new Map<string, CatalogKind>();
    for (const k of CATALOG_KINDS) m.set(CATALOG_KIND_LABEL[k], k);
    return m;
  }, []);

  // Category options = the real catalog kinds that actually have active SKUs,
  // in canonical order. If the catalog is empty, fall back to every kind so a
  // special order can still name a category.
  const categoryLabels = useMemo(() => {
    const present = new Set(catalog.map((c) => c.kind));
    const kinds = present.size ? CATALOG_KINDS.filter((k) => present.has(k)) : CATALOG_KINDS;
    return kinds.map((k) => CATALOG_KIND_LABEL[k]);
  }, [catalog]);

  const seededInitial = useMemo(() => {
    const base: Record<string, unknown> = { ...(initial ?? {}) };
    if (boundItem) {
      base.cat = CATALOG_KIND_LABEL[boundItem.kind];
      base.item = itemDisplay(boundItem);
    }
    return base;
  }, [initial, boundItem]);

  // Local mirrors of the two fields that reshape the def. Seeded from the same
  // source FormScreen seeds its values from, so they start in sync.
  const [cat, setCat] = useState<string>((seededInitial.cat as string) ?? "");
  const [customItem, setCustomItem] = useState<boolean>(false);

  const selectedKind = labelToKind.get(cat);
  const itemsForKind = useMemo(
    () =>
      catalog
        .filter((c) => c.kind === selectedKind)
        .map(itemDisplay)
        .sort((a, b) => a.localeCompare(b)),
    [catalog, selectedKind],
  );

  const def = useMemo<FormDef>(() => {
    const itemField: FormField = customItem
      ? {
          id: "type",
          label: t("m.advances.new.customItem", undefined, "Custom Item"),
          type: "text",
          required: true,
          placeholder: t("m.advances.new.customItemPlaceholder", undefined, "Describe the item you need"),
        }
      : {
          id: "item",
          label: t("m.advances.new.item", undefined, "Item"),
          type: "select",
          required: true,
          options: itemsForKind,
          hint: !cat
            ? t("m.advances.new.pickCategoryFirst", undefined, "Pick a category to see items.")
            : itemsForKind.length === 0
              ? t(
                  "m.advances.new.noItemsInCategory",
                  undefined,
                  "No catalog items in this category. Flip Special order below.",
                )
              : undefined,
        };

    const fields: FormField[] = [
      {
        id: "cat",
        label: t("m.advances.new.category", undefined, "Category"),
        type: "select",
        required: true,
        options: categoryLabels,
      },
      itemField,
      {
        id: "customItem",
        label: t("m.advances.new.specialOrder", undefined, "Not in the catalog? Special order"),
        type: "switch",
      },
      { id: "qty", label: t("m.advances.new.qty", undefined, "Quantity"), type: "number", default: "1" },
      { id: "start", label: t("m.advances.new.start", undefined, "Start Date"), type: "date", half: true, required: true },
      { id: "end", label: t("m.advances.new.end", undefined, "End Date"), type: "date", half: true, required: true },
      {
        id: "special",
        label: t("m.advances.new.special", undefined, "Special Requests"),
        type: "textarea",
        placeholder: t("m.advances.new.specialPlaceholder", undefined, "Sizing, channel, dietary, etc."),
      },
      {
        id: "purpose",
        label: t("m.advances.new.purpose", undefined, "Operational Purpose"),
        type: "textarea",
        placeholder: t("m.advances.new.purposePlaceholder", undefined, "Why is this needed for the operation?"),
        // Credentials + Radios always need a justification; Equipment too.
        requiredFor: [
          CATALOG_KIND_LABEL.credential,
          CATALOG_KIND_LABEL.radio,
          CATALOG_KIND_LABEL.equipment,
        ],
      },
      {
        id: "notes",
        label: t("m.advances.new.notes", undefined, "Additional Notes"),
        type: "textarea",
        placeholder: t("m.advances.new.notesPlaceholder", undefined, "Anything else ops should know…"),
      },
    ];

    return {
      title: t("m.advances.new.title", undefined, "Advance Request"),
      icon: "ClipboardList",
      submit: t("m.advances.new.submit", undefined, "Submit Request"),
      intro: t("m.advances.new.intro", undefined, "Request gear, credentials or services for an upcoming shift."),
      fields,
    };
  }, [t, categoryLabels, itemsForKind, cat, customItem]);

  const prefilled = !fromCatalog && !!initial && Object.keys(initial).length > 0;

  const close = () => router.push("/m/advances");

  // Keep the def-reshaping mirrors in step with FormScreen's values, and clear
  // the now-irrelevant field so a stale value can't ride along on submit.
  const onFieldChange = (
    id: string,
    value: unknown,
    _vals: Record<string, unknown>,
    patch: (updates: Record<string, unknown>) => void,
  ) => {
    if (id === "cat") {
      setCat(String(value ?? ""));
      patch({ item: "" });
    } else if (id === "customItem") {
      setCustomItem(!!value);
      patch(value ? { item: "" } : { type: "" });
    }
  };

  const submit = (_def: FormDef, vals: Record<string, unknown>) => {
    if (pending) return;
    setError(null);

    const catLabel = String(vals.cat ?? "");
    const kind = labelToKind.get(catLabel);
    if (!kind) {
      setError(t("m.advances.new.errCategory", undefined, "Pick a category."));
      return;
    }

    const fd = new FormData();
    fd.set("kind", kind);

    if (vals.customItem) {
      const custom = String(vals.type ?? "").trim();
      if (!custom) {
        setError(t("m.advances.new.errCustom", undefined, "Name the item you need."));
        return;
      }
      fd.set("special_order", "1");
      fd.set("type", custom);
    } else {
      const display = String(vals.item ?? "");
      const id = displayToId.get(display) ?? (boundItem && display === itemDisplay(boundItem) ? boundItem.id : "");
      if (!id) {
        setError(
          t("m.advances.new.errItem", undefined, "Pick an item from the catalog, or flip Special order."),
        );
        return;
      }
      fd.set("catalogItemId", id);
      // Assignment title = the SKU's human name.
      fd.set("type", idToItem.get(id)?.name ?? display);
    }

    for (const k of ["qty", "start", "end", "special", "purpose", "notes"] as const) {
      const v = vals[k];
      if (v != null && v !== "") fd.set(k, String(v));
    }

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
          {t("m.advances.new.fromCatalog", undefined, "Prefilled from the catalog. Set the dates and quantity.")}
        </p>
      )}
      {prefilled && (
        <p className="hint" style={{ marginBottom: 8 }}>
          {t("m.advances.new.prefilled", undefined, "Prefilled from your last request. Edit anything that's changed.")}
        </p>
      )}
      <FormScreen def={def} initial={seededInitial} onClose={close} onSubmit={submit} onFieldChange={onFieldChange} />
      {pending && (
        <p className="hint" style={{ marginTop: 8 }}>
          {t("m.advances.new.submitting", undefined, "Submitting…")}
        </p>
      )}
    </div>
  );
}
