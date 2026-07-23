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
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const t = useT();
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
    run(
      () => addOnboardingItem(vendorId, null, fd),
      t("console.procurement.vendorOnboarding.toasts.requirementAdded", undefined, "Requirement added"),
    );
    setLabel("");
    setRequired(true);
  }

  return (
    <div className="space-y-4">
      <div className="surface divide-y divide-[var(--p-border)]">
        {items.length === 0 ? (
          <EmptyState
            title={t("console.procurement.vendorOnboarding.empty", undefined, "No requirements yet")}
            description={t(
              "console.procurement.vendorOnboarding.emptyDescription",
              undefined,
              "Seed the standard due-diligence checklist or add your own below.",
            )}
            action={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={pending}
                onClick={() =>
                  run(
                    () => seedOnboardingDefaults(vendorId),
                    t(
                      "console.procurement.vendorOnboarding.toasts.checklistAdded",
                      undefined,
                      "Standard checklist added",
                    ),
                  )
                }
              >
                {t("console.procurement.vendorOnboarding.seedChecklist", undefined, "Seed standard checklist")}
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
                    ariaLabel={t(
                      "console.procurement.vendorOnboarding.requirementLabelAria",
                      undefined,
                      "Requirement label",
                    )}
                    className="text-sm font-medium"
                    maxLength={160}
                    onCommit={(next) => renameOnboardingItem(vendorId, it.id, next)}
                  />
                  {it.required ? (
                    <Badge variant="warning">
                      {t("console.procurement.vendorOnboarding.required", undefined, "Required")}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <Badge variant={STATE_VARIANT[it.item_state]}>{it.item_state}</Badge>
              <select
                aria-label={t(
                  "console.procurement.vendorOnboarding.stateForAria",
                  { label: it.label },
                  `State for ${it.label}`,
                )}
                value={it.item_state}
                disabled={pending}
                onChange={(e) =>
                  run(
                    () => setOnboardingItemState(vendorId, it.id, e.target.value as OnboardingItemState),
                    t("console.procurement.vendorOnboarding.toasts.updated", undefined, "Updated"),
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
                aria-label={t(
                  "console.procurement.vendorOnboarding.removeAria",
                  { label: it.label },
                  `Remove ${it.label}`,
                )}
              >
                {t("console.procurement.vendorOnboarding.remove", undefined, "Remove")}
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="surface flex flex-wrap items-end gap-3 p-3">
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[var(--p-text-2)]">
          {t("console.procurement.vendorOnboarding.addRequirement", undefined, "Add requirement")}
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t(
              "console.procurement.vendorOnboarding.addPlaceholder",
              undefined,
              "e.g. Safety prequalification (ISN)",
            )}
            className="ps-input w-full"
            maxLength={160}
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs text-[var(--p-text-2)]">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          {t("console.procurement.vendorOnboarding.required", undefined, "Required")}
        </label>
        <Button type="button" size="sm" onClick={add} loading={pending} disabled={!label.trim()}>
          {t("console.procurement.vendorOnboarding.add", undefined, "Add")}
        </Button>
      </div>
    </div>
  );
}
