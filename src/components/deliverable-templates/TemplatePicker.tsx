"use client";

import * as React from "react";
import { FilePlus2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";

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
  triggerLabel = "Start from template",
}: {
  typeFilter?: string;
  onPick: (t: Template) => void;
  triggerLabel?: string;
}) {
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
        className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-3 py-1.5 text-xs hover:bg-[var(--surface-inset)]"
      >
        <FilePlus2 size={12} />
        <span>{triggerLabel}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Pick a template</DialogTitle>
            <DialogDescription>
              Pre-fill the deliverable with a saved template. Org-scoped templates appear alongside
              platform globals.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] px-2 py-1.5">
            <Search size={12} className="text-[var(--text-muted)]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Filter templates…"
              aria-label="Filter templates"
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>

          <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto pr-1">
            {loading && (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">Loading templates…</div>
            )}
            {!loading &&
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onPick(t);
                    setOpen(false);
                  }}
                  className="block w-full rounded border border-transparent px-3 py-2 text-left text-xs hover:border-[var(--border-color)] hover:bg-[var(--surface-inset)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--text-primary)]">{t.name}</span>
                    <span className="rounded bg-[var(--surface-inset)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                      {t.type}
                    </span>
                  </div>
                  {t.description && (
                    <div className="mt-1 text-[var(--text-muted)]">{t.description}</div>
                  )}
                  {t.is_global && (
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      Platform template
                    </div>
                  )}
                </button>
              ))}
            {!loading && filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                {templates.length === 0
                  ? "No templates yet. Create one from /console/settings/templates."
                  : `No templates match “${query}”.`}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
