"use client";

import * as React from "react";
import { Bookmark, Check, Edit3, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Hint } from "@/components/ui/Tooltip";
import type { SavedView, ViewConfigRow, ViewScope } from "@/lib/views/types";
import { SaveViewDialog, type SaveViewSubmit } from "./SaveViewDialog";

/**
 * SavedViewSelector — dropdown listing the named saved views the caller
 * can see for a given `tableId`, grouped by scope (My Views / Shared /
 * Public). Footer surfaces "Save current view…" and per-row controls
 * (Edit / Set as default / Delete).
 *
 * Stays a controlled component: the parent (`DataTableInteractive`) owns
 * the active view id and the working-copy SavedView state. We just
 * announce selections / saves / deletes upward.
 */

const TRIGGER_BASE =
  "inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--org-primary)]";
const TRIGGER_ACTIVE = "bg-[var(--surface-inset)] text-[var(--text-primary)]";

export type SavedViewSelectorProps = {
  /** All saved views visible to the caller for the current table. The
   *  parent loads these server-side and threads them through the chrome. */
  views: ViewConfigRow[];
  /** Currently-active saved view id, or `null` for the unsaved
   *  working-copy (Default View). */
  activeId: string | null;
  /** Snapshot of the current local SavedView — fed to the SaveViewDialog
   *  on "Save current view…". */
  currentConfig: SavedView;
  /** Scopes the caller is allowed to publish to. Defaults to private. */
  allowedScopes?: ViewScope[];
  /** Called when the user picks a saved view (or `null` for Default). The
   *  parent should hydrate its local state from the row's config. */
  onLoad: (view: ViewConfigRow | null) => void;
  /** Called after the SaveViewDialog submits. Implementation should write
   *  to the `view_configs` table and return the resulting row so the
   *  selector list can refresh. */
  onSave: (input: SaveViewSubmit) => Promise<void>;
  /** Called when the user picks "Delete" on a row. Implementation
   *  performs the delete + refresh. */
  onDelete?: (id: string) => Promise<void>;
  /** Called when the user picks "Set as default" on a row. */
  onSetDefault?: (id: string) => Promise<void>;
  /** Whether the current local state has drifted from the active row's
   *  config. Surfaces a subtle "modified" indicator on the trigger. */
  modified?: boolean;
};

export function SavedViewSelector({
  views,
  activeId,
  currentConfig,
  allowedScopes = ["private"],
  onLoad,
  onSave,
  onDelete,
  onSetDefault,
  modified,
}: SavedViewSelectorProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ViewConfigRow | null>(null);

  const active = React.useMemo(() => views.find((v) => v.id === activeId) ?? null, [views, activeId]);

  const grouped = React.useMemo(() => groupByScope(views), [views]);

  const triggerLabel = active ? active.name : "Default View";

  return (
    <>
      <DropdownMenu>
        <Hint label={modified ? "Saved view · current state has unsaved changes" : "Switch saved view"}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Saved view selector"
              className={`${TRIGGER_BASE} ${active ? TRIGGER_ACTIVE : ""}`}
            >
              <Bookmark size={12} aria-hidden="true" />
              <span className="max-w-[12rem] truncate">{triggerLabel}</span>
              {modified && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--org-primary)]"
                  title="Unsaved changes"
                />
              )}
            </button>
          </DropdownMenuTrigger>
        </Hint>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuItem onSelect={() => onLoad(null)}>
            <span className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5">
                {!activeId && <Check size={12} aria-hidden="true" />}
                <span className={!activeId ? "" : "ml-[18px]"}>Default View</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Auto-Saved</span>
            </span>
          </DropdownMenuItem>

          {(["private", "org", "public"] as ViewScope[]).map((scope) => {
            const rows = grouped.get(scope) ?? [];
            if (!rows.length) return null;
            return (
              <React.Fragment key={scope}>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)]">
                  {headingForScope(scope)}
                </div>
                {rows.map((view) => (
                  <SavedViewRow
                    key={view.id}
                    view={view}
                    active={activeId === view.id}
                    onLoad={() => onLoad(view)}
                    onEdit={() => {
                      setEditing(view);
                      setDialogOpen(true);
                    }}
                    onDelete={
                      onDelete
                        ? async () => {
                            if (!confirm(`Delete "${view.name}"? This cannot be undone.`)) return;
                            try {
                              await onDelete(view.id);
                              toast.success("View Deleted");
                              if (activeId === view.id) onLoad(null);
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Could not delete view");
                            }
                          }
                        : undefined
                    }
                    onSetDefault={
                      onSetDefault
                        ? async () => {
                            try {
                              await onSetDefault(view.id);
                              toast.success("Default Updated");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Could not set default");
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </React.Fragment>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={12} aria-hidden="true" className="me-1.5" />
            Save Current View…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveViewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentConfig={currentConfig}
        editing={editing}
        allowedScopes={allowedScopes}
        onSubmit={onSave}
      />
    </>
  );
}

function SavedViewRow({
  view,
  active,
  onLoad,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  view: ViewConfigRow;
  active: boolean;
  onLoad: () => void;
  onEdit: () => void;
  onDelete?: () => Promise<void> | void;
  onSetDefault?: () => Promise<void> | void;
}) {
  return (
    <div className="group relative flex items-center justify-between gap-1 px-2 py-1 hover:bg-[var(--surface-inset)]">
      <button type="button" onClick={onLoad} className="flex flex-1 items-center gap-1.5 truncate text-left text-sm">
        {active ? <Check size={12} aria-hidden="true" /> : <span className="inline-block w-3" />}
        <span className="truncate">{view.name}</span>
        {view.isDefault && <Star size={10} aria-hidden="true" className="text-[var(--org-primary)]" />}
        {view.isLocked && (
          <span className="text-[10px] text-[var(--text-muted)]" aria-label="Locked view">
            (locked)
          </span>
        )}
      </button>
      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        {onSetDefault && !view.isDefault && (
          <Hint label="Set as default for this scope">
            <button
              type="button"
              aria-label={`Set "${view.name}" as default`}
              onClick={() => void onSetDefault()}
              className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
            >
              <Star size={11} aria-hidden="true" />
            </button>
          </Hint>
        )}
        <Hint label="Edit name / scope">
          <button
            type="button"
            aria-label={`Edit "${view.name}"`}
            onClick={onEdit}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
          >
            <Edit3 size={11} aria-hidden="true" />
          </button>
        </Hint>
        {onDelete && (
          <Hint label="Delete view">
            <button
              type="button"
              aria-label={`Delete "${view.name}"`}
              onClick={() => void onDelete()}
              className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--danger,red)]"
            >
              <Trash2 size={11} aria-hidden="true" />
            </button>
          </Hint>
        )}
      </span>
    </div>
  );
}

function groupByScope(views: ViewConfigRow[]): Map<ViewScope, ViewConfigRow[]> {
  const map = new Map<ViewScope, ViewConfigRow[]>();
  for (const v of views) {
    const arr = map.get(v.scope) ?? [];
    arr.push(v);
    map.set(v.scope, arr);
  }
  return map;
}

function headingForScope(scope: ViewScope): string {
  switch (scope) {
    case "private":
      return "My Views";
    case "org":
      return "Shared";
    case "public":
      return "Public";
  }
}
