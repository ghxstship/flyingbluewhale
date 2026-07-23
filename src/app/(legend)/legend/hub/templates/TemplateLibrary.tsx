"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { resolveActionError } from "@/lib/errors";
import { Badge } from "@/components/ui/Badge";
import { DOC_BRAND_MODES } from "@/lib/documents/org-settings";
import {
  TEMPLATE_FAMILIES,
  type TemplateFamily,
  type TemplateLibraryItem,
} from "@/lib/templates/library-shared";
import { setDocTemplateSettingAction } from "./actions";

/**
 * The ONE template library (L-P2) — a client island over the merged
 * four-family index built server-side. Unified search + family filter;
 * sections per family; every item deep-links to its native editor/preview.
 * Manager+ additionally gets the doc-family configurator (per-type enabled
 * toggle + default brand select over org_doc_template_settings).
 *
 * Enforcement rule surfaced here verbatim: a disabled doc type is hidden
 * from creation pickers but stays renderable for existing records.
 */

type Props = {
  items: TemplateLibraryItem[];
  canManage: boolean;
  createHrefs: Record<TemplateFamily, string | null>;
  homeHrefs: Record<TemplateFamily, string>;
};

const FAMILY_ORDER: TemplateFamily[] = [...TEMPLATE_FAMILIES];

export function TemplateLibrary({ items, canManage, createHrefs, homeHrefs }: Props) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<TemplateFamily | "all">("all");
  const [newOpen, setNewOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const familyLabel: Record<TemplateFamily, string> = {
    doc: t("console.legend.hub.templates.family.doc", undefined, "Document templates"),
    job: t("console.legend.hub.templates.family.job", undefined, "Job templates"),
    field: t("console.legend.hub.templates.family.field", undefined, "Field templates"),
    advance: t("console.legend.hub.templates.family.advance", undefined, "Advance packet presets"),
  };
  const familyBlurb: Record<TemplateFamily, string> = {
    doc: t(
      "console.legend.hub.templates.family.docBlurb",
      undefined,
      "The kit document registry. Code-defined types; your org controls which are offered and their default brand mode.",
    ),
    job: t(
      "console.legend.hub.templates.family.jobBlurb",
      undefined,
      "Reusable scope checklists that seed a work order's task list.",
    ),
    field: t(
      "console.legend.hub.templates.family.fieldBlurb",
      undefined,
      "Checklists, forms, and inspection shapes the COMPVSS field app runs on site.",
    ),
    advance: t(
      "console.legend.hub.templates.family.advanceBlurb",
      undefined,
      "Per-audience section matrices that seed every advance campaign.",
    ),
  };
  const familyOpenLabel: Record<TemplateFamily, string> = {
    doc: t("console.legend.hub.templates.family.docOpen", undefined, "Open document library"),
    job: t("console.legend.hub.templates.family.jobOpen", undefined, "Open job templates"),
    field: t("console.legend.hub.templates.family.fieldOpen", undefined, "Open in COMPVSS"),
    advance: t("console.legend.hub.templates.family.advanceOpen", undefined, "Open preset matrix"),
  };
  const familyHome = homeHrefs;

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      items.filter(
        (i) => (family === "all" || i.family === family) && (q === "" || i.searchText.includes(q)),
      ),
    [items, family, q],
  );
  const byFamily = useMemo(() => {
    const map = new Map<TemplateFamily, TemplateLibraryItem[]>();
    for (const f of FAMILY_ORDER) map.set(f, []);
    for (const i of visible) map.get(i.family)?.push(i);
    return map;
  }, [visible]);

  const countLabel = (f: TemplateFamily) => {
    const n = items.filter((i) => i.family === f).length;
    return n === 1
      ? t("console.legend.hub.templates.oneTemplate", undefined, "1 template")
      : t("console.legend.hub.templates.nTemplates", { count: n }, `${n} templates`);
  };

  const saveDocSetting = (docType: string, enabled: boolean, defaultBrand: string | null) => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("doc_type", docType);
      fd.set("enabled", enabled ? "true" : "false");
      fd.set("default_brand", defaultBrand ?? "");
      const res = await setDocTemplateSettingAction(null, fd);
      if (res?.error) setActionError(resolveActionError(res.error, t));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search + family filter + New template */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            "console.legend.hub.templates.searchPlaceholder",
            undefined,
            "Search all template families",
          )}
          aria-label={t("console.legend.hub.templates.searchAria", undefined, "Search templates")}
          className="ps-input ps-input--sm w-full max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("console.legend.hub.templates.familyFilterAria", undefined, "Filter by family")}>
          <button
            type="button"
            onClick={() => setFamily("all")}
            aria-pressed={family === "all"}
            className="ps-chip ps-chip--sm ps-chip--selectable"
          >
            {t("console.legend.hub.templates.allFamilies", undefined, "All")}
          </button>
          {FAMILY_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(family === f ? "all" : f)}
              aria-pressed={family === f}
              className="ps-chip ps-chip--sm ps-chip--selectable"
            >
              {familyLabel[f]}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setNewOpen((v) => !v)}
            aria-expanded={newOpen}
            aria-haspopup="menu"
            className="ps-btn ps-btn--sm"
          >
            {t("console.legend.hub.templates.newTemplate", undefined, "New Template")}
          </button>
          {newOpen && (
            <div
              role="menu"
              className="surface-raised absolute right-0 z-20 mt-1 w-72 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-1.5"
            >
              {(["job", "field", "advance"] as TemplateFamily[]).map((f) =>
                createHrefs[f] ? (
                  <Link
                    key={f}
                    role="menuitem"
                    href={createHrefs[f]!}
                    className="focus-ring block rounded-[var(--p-r-sm)] px-3 py-2 text-sm hover:bg-[var(--p-surface-2)]"
                    onClick={() => setNewOpen(false)}
                  >
                    <span className="font-medium">{familyLabel[f]}</span>
                    <span className="mt-0.5 block text-xs text-[var(--p-text-2)]">{familyBlurb[f]}</span>
                  </Link>
                ) : null,
              )}
              <div className="mt-1 border-t border-[var(--p-border)] px-3 py-2 text-xs text-[var(--p-text-2)]">
                {t(
                  "console.legend.hub.templates.docTypesFixed",
                  undefined,
                  "Document types are registry-fixed and cannot be authored per org. Configure which types are offered, and their default brand, in the Document templates section below.",
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-[var(--p-danger-text)]">
          {actionError}
        </p>
      )}

      {visible.length === 0 && (
        <p className="text-sm text-[var(--p-text-2)]">
          {t("console.legend.hub.templates.noMatches", undefined, "No templates match the current search.")}
        </p>
      )}

      {FAMILY_ORDER.map((f) => {
        const list = byFamily.get(f) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={f} aria-label={familyLabel[f]}>
            <div className="mb-2 flex flex-wrap items-baseline gap-3">
              <h2 className="text-lg">{familyLabel[f]}</h2>
              <span className="ps-id text-xs text-[var(--p-text-2)]">{countLabel(f)}</span>
              <Link
                href={familyHome[f]}
                className="focus-ring ml-auto text-sm font-medium text-[var(--p-accent-text)] hover:underline"
              >
                {familyOpenLabel[f]}
              </Link>
            </div>
            <p className="mb-3 max-w-2xl text-sm text-[var(--p-text-2)]">{familyBlurb[f]}</p>
            {f === "doc" && (
              <p className="mb-3 max-w-2xl text-xs text-[var(--p-text-3)]">
                {t(
                  "console.legend.hub.templates.docDisabledRule",
                  undefined,
                  "Disabled types are hidden from creation pickers. Documents already issued against a disabled type still render.",
                )}
              </p>
            )}
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => (
                <li
                  key={`${item.family}:${item.id}`}
                  className={`surface flex flex-col gap-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4 ${
                    item.family === "doc" && !item.enabled ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={item.href} className="focus-ring font-semibold hover:underline">
                      {item.title}
                    </Link>
                    {item.family === "doc" && item.app && (
                      <span className="ps-id shrink-0 text-[11px] tracking-wide text-[var(--p-text-3)] uppercase">
                        {item.app}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <span className="font-mono text-[11px] text-[var(--p-text-3)]">{item.subtitle}</span>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--p-text-2)]">
                    {item.mergeFieldCount != null && (
                      <span>
                        {t(
                          "console.legend.hub.templates.mergeFields",
                          { count: item.mergeFieldCount },
                          `${item.mergeFieldCount} merge fields`,
                        )}
                      </span>
                    )}
                    {item.recordBacked && (
                      <Badge variant="brand">
                        {t("console.legend.hub.templates.recordBacked", undefined, "Record-backed")}
                      </Badge>
                    )}
                    {item.family === "doc" && !item.enabled && (
                      <Badge variant="muted">
                        {t("console.legend.hub.templates.hiddenFromPickers", undefined, "Hidden from pickers")}
                      </Badge>
                    )}
                    {item.stepCount != null && (
                      <span>
                        {t(
                          "console.legend.hub.templates.nSteps",
                          { count: item.stepCount },
                          `${item.stepCount} steps`,
                        )}
                      </span>
                    )}
                    {item.useCount != null && (
                      <span>
                        {t(
                          "console.legend.hub.templates.usedNTimes",
                          { count: item.useCount },
                          `Used ${item.useCount} times`,
                        )}
                      </span>
                    )}
                    {item.sectionCount != null && (
                      <span>
                        {t(
                          "console.legend.hub.templates.nSections",
                          { count: item.sectionCount },
                          `${item.sectionCount} sections`,
                        )}
                      </span>
                    )}
                  </div>
                  {item.family === "doc" && canManage && (
                    <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-[var(--p-border)] pt-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--p-text-2)]">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          disabled={pending}
                          onChange={(e) => saveDocSetting(item.id, e.target.checked, item.defaultBrand)}
                        />
                        {t("console.legend.hub.templates.offered", undefined, "Offered")}
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-[var(--p-text-2)]">
                        {t("console.legend.hub.templates.defaultBrand", undefined, "Default brand")}
                        <select
                          className="ps-input ps-input--sm"
                          value={item.defaultBrand ?? ""}
                          disabled={pending}
                          onChange={(e) => saveDocSetting(item.id, item.enabled, e.target.value || null)}
                        >
                          <option value="">
                            {t("console.legend.hub.templates.brandViewerDefault", undefined, "Viewer default")}
                          </option>
                          {DOC_BRAND_MODES.map((b) => (
                            <option key={b} value={b}>
                              {b === "atlvs"
                                ? t("console.legend.hub.templates.brandAtlvs", undefined, "ATLVS")
                                : b === "co"
                                  ? t("console.legend.hub.templates.brandCo", undefined, "Co-brand")
                                  : t("console.legend.hub.templates.brandWhite", undefined, "White-label")}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
