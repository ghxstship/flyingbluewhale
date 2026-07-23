"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EditableCell } from "@/components/ui/EditableCell";
import {
  addOnboardingItem,
  deleteOnboardingItem,
  renameOnboardingItem,
  seedOnboardingDefaults,
  setOnboardingItemState,
  type OnboardingItemState,
} from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
export type OnboardingItem = {
  id: string;
  label: string;
  required: boolean;
  item_state: OnboardingItemState;
  completed_at: string | null;
};

const STATES: OnboardingItemState[] = ["pending", "submitted", "approved", "waived"];
const STATE_VARIANT: Record<OnboardingItemState, "muted" | "info" | "success" | "default"> = {
  pending: "muted",
  submitted: "info",
  approved: "success",
  waived: "default",
};

export function OnboardingChecklist({ vendorId, items }: { vendorId: string; items: OnboardingItem[] }) {
  const router = useRouter();
  const resolveErr = useActionErrorResolver();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(true);

  function run(fn: () => Promise<{ error?: string } | null>, ok?: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        toast.error(resolveErr(res.error));
        return;
      }
      if (ok) toast.success(ok);
      router.refresh();
    });
  }

  function add() {
    if (!label.trim()) return;
    const fd = new FormData();
    fd.set("label", label.trim());
    if (required) fd.set("required", "on");
    run(() => addOnboardingItem(vendorId, null, fd), "Requirement added");
    setLabel("");
    setRequired(true);
  }

  return (
    <div className="space-y-4">
      <div className="surface divide-y divide-[var(--p-border)]">
        {items.length === 0 ? (
          <EmptyState
            title="No requirements yet"
            description="Seed the standard due-diligence checklist or add your own below."
            action={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={pending}
                onClick={() => run(() => seedOnboardingDefaults(vendorId), "Standard checklist added")}
              >
                Seed standard checklist
              </Button>
            }
          />
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <EditableCell
                    value={it.label}
                    ariaLabel="Requirement label"
                    className="text-sm font-medium"
                    maxLength={160}
                    onCommit={(next) => renameOnboardingItem(vendorId, it.id, next)}
                  />
                  {it.required ? <Badge variant="warning">Required</Badge> : null}
                </div>
              </div>
              <Badge variant={STATE_VARIANT[it.item_state]}>{it.item_state}</Badge>
              <select
                aria-label={`State for ${it.label}`}
                value={it.item_state}
                disabled={pending}
                onChange={(e) =>
                  run(
                    () => setOnboardingItemState(vendorId, it.id, e.target.value as OnboardingItemState),
                    "Updated",
                  )
                }
                className="ps-input w-36 text-xs"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => run(() => deleteOnboardingItem(vendorId, it.id))}
                aria-label={`Remove ${it.label}`}
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="surface flex flex-wrap items-end gap-3 p-3">
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[var(--p-text-2)]">
          Add requirement
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Safety prequalification (ISN)"
            className="ps-input w-full"
            maxLength={160}
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs text-[var(--p-text-2)]">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Required
        </label>
        <Button type="button" size="sm" onClick={add} loading={pending} disabled={!label.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
