"use client";

import * as React from "react";
import { FilePlus2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Deliverable template picker — lazy-loads templates from
 * `/api/v1/deliverable-templates`, filters by type and query, calls
 * `onPick` with the selected template so the host form can pre-fill.
 * Used from the advancing flow on both console + portal.
 */

type Template = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  data: Record<string, unknown>;
  is_global: boolean;
  updated_at: string;
};

export function TemplatePicker({
  typeFilter,
  onPick,
  triggerLabel,
}: {
  typeFilter?: string;
  onPick: (t: Template) => void;
  triggerLabel?: string;
}) {
  const t = useT();
  const resolvedTriggerLabel = triggerLabel ?? t("components.templatePicker.trigger", undefined, "Start from template");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const url = typeFilter ? `/api/v1/deliverable-templates?type=${typeFilter}` : "/api/v1/deliverable-templates";
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok) setTemplates(json.data.templates ?? []);
      })
      .finally(() => setLoading(false));
  }, [open, typeFilter]);

  const filtered = React.useMemo(() => {
    if (!query) return templates;
    const q = query.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.type.toLowerCase().includes(q),
    );
  }, [templates, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded border border-[var(--p-border)] px-3 py-1.5 text-xs hover:bg-[var(--p-surface-2)]"
      >
        <FilePlus2 size={12} />
        <span>{resolvedTriggerLabel}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{t("components.templatePicker.title", undefined, "Pick a template")}</DialogTitle>
            <DialogDescription>
              {t(
                "components.templatePicker.description",
                undefined,
                "Pre-fill the deliverable with a saved template. Org-scoped templates appear alongside platform globals.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] px-2 py-1.5">
            <Search size={12} className="text-[var(--p-text-2)]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder={t("components.templatePicker.filterPlaceholder", undefined, "Filter templates…")}
              aria-label={t("components.templatePicker.filterLabel", undefined, "Filter Templates")}
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>

          <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto pe-1">
            {loading && (
              <div className="py-8 text-center text-xs text-[var(--p-text-2)]">
                {t("components.templatePicker.loading", undefined, "Loading templates…")}
              </div>
            )}
            {!loading &&
              filtered.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    onPick(tpl);
                    setOpen(false);
                  }}
                  className="block w-full rounded border border-transparent px-3 py-2 text-start text-xs hover:border-[var(--p-border)] hover:bg-[var(--p-surface-2)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--p-text-1)]">{tpl.name}</span>
                    <span className="rounded bg-[var(--p-surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--p-text-2)]">
                      {tpl.type}
                    </span>
                  </div>
                  {tpl.description && <div className="mt-1 text-[var(--p-text-2)]">{tpl.description}</div>}
                  {tpl.is_global && (
                    <div className="mt-1 text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
                      {t("components.templatePicker.platformTemplate", undefined, "Platform template")}
                    </div>
                  )}
                </button>
              ))}
            {!loading && filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-[var(--p-text-2)]">
                {templates.length === 0
                  ? t(
                      "components.templatePicker.emptyNone",
                      undefined,
                      "No templates yet. Create one from /console/settings/templates.",
                    )
                  : t("components.templatePicker.emptyNoMatch", { query }, "No templates match “{query}”.")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
