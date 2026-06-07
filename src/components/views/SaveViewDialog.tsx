"use client";

import * as React from "react";
import { toast } from "sonner";
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
        toast.error("Name is required");
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
        toast.success(editing ? "View Updated" : "View Saved");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save view");
      } finally {
        setSubmitting(false);
      }
    },
    [name, description, scope, type, currentConfig, editing, onOpenChange, onSubmit],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Saved View" : "Save Current View"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Rename, re-scope, or relock this saved view. Existing config snapshot is preserved."
                : "Capture the current sort, filters, columns, and density as a named view you can return to."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              label="Name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Open RFIs · Critical"
              maxLength={120}
            />

            <Input
              label="Description"
              hint="Optional — explain when this view is useful."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context for teammates"
              maxLength={500}
            />

            {allowedScopes.length > 1 && (
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold tracking-wide text-[var(--p-text-2)]">Visibility</legend>
                <div className="flex flex-col gap-1.5">
                  {allowedScopes.includes("private") && (
                    <ScopeRadio
                      checked={scope === "private"}
                      onChange={() => setScope("private")}
                      label="Private"
                      hint="Only you. Stored in your views list."
                    />
                  )}
                  {allowedScopes.includes("org") && (
                    <ScopeRadio
                      checked={scope === "org"}
                      onChange={() => setScope("org")}
                      label="Shared with the org"
                      hint="Visible to every org member under Shared."
                    />
                  )}
                  {allowedScopes.includes("public") && (
                    <ScopeRadio
                      checked={scope === "public"}
                      onChange={() => setScope("public")}
                      label="Public"
                      hint="Accessible via a share link."
                    />
                  )}
                </div>
              </fieldset>
            )}

            <div className="space-y-1.5">
              <label htmlFor="save-view-type" className="text-xs font-semibold tracking-wide text-[var(--p-text-2)]">
                View Type
              </label>
              <select
                id="save-view-type"
                value={type}
                onChange={(e) => setType(e.target.value as ViewType)}
                className="w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
              >
                {VIEW_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {labelForType(t)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--p-text-2)]">
                Only Grid renders today. Other types reserve the row for an upcoming alt renderer.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? "Save Changes" : "Save View"}
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

function labelForType(t: ViewType): string {
  switch (t) {
    case "grid":
      return "Grid";
    case "kanban":
      return "Kanban";
    case "calendar":
      return "Calendar";
    case "timeline":
      return "Timeline";
    case "chart":
      return "Chart";
    case "map":
      return "Map";
    case "gantt":
      return "Gantt";
    case "card":
      return "Card";
    case "form":
      return "Form";
  }
}
