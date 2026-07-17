"use client";

import * as React from "react";
import { toast } from "@/lib/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SavedView, ViewConfigRow, ViewScope, ViewType } from "@/lib/views/types";
import { VIEW_TYPES } from "@/lib/views/types";
import { useT } from "@/lib/i18n/LocaleProvider";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/**
 * SaveViewDialog — modal for naming + scoping a new (or editing an
 * existing) saved view. On submit posts to a server action wired by the
 * caller; the parent supplies the current local SavedView snapshot via
 * `currentConfig` so the dialog only owns the metadata (name, scope,
 * type, description), not the working-copy state.
 *
 * Scope options:
 *   private — visible only to the caller (always allowed)
 *   org     — visible to the whole org (RLS gates by manager+ role)
 *   public  — visible via /share/[token] (RLS gates by manager+ role)
 *
 * The caller decides whether to surface `org` and `public` via
 * `allowedScopes`; below the role threshold the radio group hides them.
 */

export type SaveViewSubmit = {
  name: string;
  description?: string;
  scope: ViewScope;
  type: ViewType;
  config: SavedView;
  upsertById?: string;
};

export type SaveViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Snapshot of the table's current local SavedView state — copied into
   *  the new row's `config` JSONB on submit. */
  currentConfig: SavedView;
  /** When set, the dialog edits this row in place rather than inserting
   *  a new one. The form is prefilled from the row's metadata. */
  editing?: ViewConfigRow | null;
  /** Scopes the caller is allowed to choose from. Defaults to private only;
   *  pass `["private", "org", "public"]` for managers / admins. */
  allowedScopes?: ViewScope[];
  /** Default view type — almost always `'grid'` until P3.2-3.6 alt
   *  renderers ship; future callers can prefill (e.g. from a Kanban page). */
  defaultType?: ViewType;
  /** Server callback. Returns void; throw to surface an error in the dialog. */
  onSubmit: (input: SaveViewSubmit) => Promise<void>;
};

export function SaveViewDialog({
  open,
  onOpenChange,
  currentConfig,
  editing,
  allowedScopes = ["private"],
  defaultType = "grid",
  onSubmit,
}: SaveViewDialogProps) {
  const t = useT();
  const [name, setName] = React.useState<string>(editing?.name ?? "");
  const [description, setDescription] = React.useState<string>(editing?.description ?? "");
  const [scope, setScope] = React.useState<ViewScope>(editing?.scope ?? allowedScopes[0] ?? "private");
  const [type, setType] = React.useState<ViewType>(editing?.type ?? defaultType);
  const [submitting, setSubmitting] = React.useState(false);

  // Reset local state when the dialog re-opens against a different `editing`
  // target. Without this, switching between Edit / New leaves stale values.
  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setScope(editing?.scope ?? allowedScopes[0] ?? "private");
    setType(editing?.type ?? defaultType);
  }, [open, editing, allowedScopes, defaultType]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        toast.error(t("savedViews.toast.nameRequired", undefined, "Name is required"));
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit({
          name: trimmed,
          description: description.trim() || undefined,
          scope,
          type,
          config: currentConfig,
          upsertById: editing?.id,
        });
        toast.success(
          editing
            ? t("savedViews.toast.updated", undefined, "View Updated")
            : t("savedViews.toast.saved", undefined, "View Saved"),
        );
        onOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("savedViews.toast.saveFailed", undefined, "Could not save view"),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [name, description, scope, type, currentConfig, editing, onOpenChange, onSubmit, t],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t("savedViews.editTitle", undefined, "Edit Saved View")
                : t("savedViews.newTitle", undefined, "Save Current View")}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? t(
                    "savedViews.editDescription",
                    undefined,
                    "Rename, re-scope, or relock this saved view. Existing config snapshot is preserved.",
                  )
                : t(
                    "savedViews.newDescription",
                    undefined,
                    "Capture the current sort, filters, columns, and density as a named view you can return to.",
                  )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              label={t("savedViews.nameLabel", undefined, "Name")}
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("savedViews.namePlaceholder", undefined, "e.g. Open RFIs · Critical")}
              maxLength={120}
            />

            <Input
              label={t("savedViews.descriptionLabel", undefined, "Description")}
              hint={t("savedViews.descriptionHint", undefined, "Optional — explain when this view is useful.")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("savedViews.descriptionPlaceholder", undefined, "Add context for teammates")}
              maxLength={500}
            />

            {allowedScopes.length > 1 && (
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold tracking-wide text-[var(--p-text-2)]">
                  {t("savedViews.visibility", undefined, "Visibility")}
                </legend>
                <div className="flex flex-col gap-1.5">
                  {allowedScopes.includes("private") && (
                    <ScopeRadio
                      checked={scope === "private"}
                      onChange={() => setScope("private")}
                      label={t("savedViews.scope.private", undefined, "Private")}
                      hint={t("savedViews.scope.privateHint", undefined, "Only you. Stored in your views list.")}
                    />
                  )}
                  {allowedScopes.includes("org") && (
                    <ScopeRadio
                      checked={scope === "org"}
                      onChange={() => setScope("org")}
                      label={t("savedViews.scope.org", undefined, "Shared with the org")}
                      hint={t("savedViews.scope.orgHint", undefined, "Visible to every org member under Shared.")}
                    />
                  )}
                  {allowedScopes.includes("public") && (
                    <ScopeRadio
                      checked={scope === "public"}
                      onChange={() => setScope("public")}
                      label={t("savedViews.scope.public", undefined, "Public")}
                      hint={t("savedViews.scope.publicHint", undefined, "Accessible via a share link.")}
                    />
                  )}
                </div>
              </fieldset>
            )}

            <div className="space-y-1.5">
              <label htmlFor="save-view-type" className="text-xs font-semibold tracking-wide text-[var(--p-text-2)]">
                {t("savedViews.viewType", undefined, "View Type")}
              </label>
              <select
                id="save-view-type"
                value={type}
                onChange={(e) => setType(e.target.value as ViewType)}
                className="w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-focus)]"
              >
                {VIEW_TYPES.map((vt) => (
                  <option key={vt} value={vt}>
                    {labelForType(vt, t)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--p-text-2)]">
                {t(
                  "savedViews.viewTypeNote",
                  undefined,
                  "Only Grid renders today. Other types reserve the row for an upcoming alt renderer.",
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("savedViews.cancel", undefined, "Cancel")}
            </Button>
            <Button type="submit" loading={submitting}>
              {editing
                ? t("savedViews.saveChanges", undefined, "Save Changes")
                : t("savedViews.saveView", undefined, "Save View")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ScopeRadio({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--p-border)] px-2 py-1.5 text-sm hover:bg-[var(--p-surface-2)]">
      <input
        type="radio"
        name="view-scope"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-[var(--p-accent)]"
      />
      <span className="flex flex-col">
        <span className="text-[var(--p-text-1)]">{label}</span>
        <span className="text-[11px] text-[var(--p-text-2)]">{hint}</span>
      </span>
    </label>
  );
}

function labelForType(viewType: ViewType, t: Translator): string {
  const fallbacks: Record<ViewType, string> = {
    grid: "Grid",
    kanban: "Kanban",
    calendar: "Calendar",
    timeline: "Timeline",
    chart: "Chart",
    map: "Map",
    gantt: "Gantt",
    card: "Card",
    form: "Form",
  };
  return t(`savedViews.types.${viewType}`, undefined, fallbacks[viewType]);
}
